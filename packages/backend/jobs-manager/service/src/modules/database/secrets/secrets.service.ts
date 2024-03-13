import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Filter } from 'mongodb';
import { Model, Types } from 'mongoose';
import * as forge from 'node-forge';
import { Secret, SecretDocument } from './secrets.model';

const keyEnvironmentVariable = 'SECRET_PUBLIC_RSA_KEY';
export const secretPrefix = '$$secret$$';

@Injectable()
export class SecretsService {
  constructor(
    @InjectModel('secret')
    private readonly secretModel: Model<Secret>,
  ) {}

  private readonly selectValueProjection = '+value';
  private static readonly publicKey = forge.pki.publicKeyFromPem(
    forge.util.decode64(process.env[keyEnvironmentVariable]),
  );

  public async getAll(): Promise<SecretDocument[]> {
    return await this.secretModel.find({});
  }

  public async get(id: string): Promise<SecretDocument | null> {
    return await this.secretModel.findById(id);
  }

  /**
   * A secret can be generic (not assigned to a project), or assigned to a project.
   * For an identical secret name, a secret for a project overwrites a generic secret.
   * @param name The secret name
   * @param projectId The project Id, can be undefined, null or even an empty string
   * @returns The secret, including its encrypted value, or undefined
   */
  public async getBestSecretWithValue(
    name: string,
    projectId: string = undefined,
  ): Promise<SecretDocument | undefined> {
    let projectFilter: Filter<Secret> = { projectId: null };
    if (projectId) {
      projectFilter = {
        $or: [
          { projectId: { $eq: new Types.ObjectId(projectId) } },
          projectFilter,
        ],
      };
    }

    const secrets = await this.secretModel.find(
      {
        name: { $eq: name },
        projectFilter,
      },
      this.selectValueProjection,
    );

    if (!secrets || (Array.isArray(secrets) && secrets.length === 0))
      return undefined;

    let bestSecret: SecretDocument = undefined;
    for (const secret of secrets) {
      bestSecret = secret;
      if (secret._id.toString() === projectId) {
        return bestSecret;
      }
    }

    return bestSecret;
  }

  public async create(
    name: string,
    value: string,
    projectId: string = undefined,
    description: string = undefined,
  ): Promise<Pick<SecretDocument, '_id' | 'name' | 'projectId'>> {
    const secret = await this.secretModel.create({
      name: name,
      projectId: projectId ? new Types.ObjectId(projectId) : undefined,
      value: SecretsService.encrypt(value),
      description: description,
    });

    secret.value = undefined;
    return secret;
  }

  public async delete(id: string) {
    return this.secretModel.deleteOne({ _id: { $eq: new Types.ObjectId(id) } });
  }

  public static encrypt(value: string) {
    const encrypted = this.publicKey.encrypt(value);
    return secretPrefix + forge.util.encode64(encrypted);
  }

  public async deleteAllForProject(projectId: string) {
    return await this.secretModel.deleteMany({
      _id: { $eq: new Types.ObjectId(projectId) },
    });
  }
}
