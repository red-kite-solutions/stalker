import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Filter } from 'mongodb';
import { Model, Types } from 'mongoose';
import { Secret, SecretDocument } from './secrets.model';

const keyEnvironmentVariable = 'SECRET_AES256_KEY';

@Injectable()
export class SecretsService {
  constructor(
    @InjectModel('secret')
    private readonly secretModel: Model<Secret>,
  ) {}

  private readonly hideValueProjection = '-value';
  private static readonly cipherType: crypto.CipherGCMTypes = 'aes-256-gcm';
  private static readonly key: crypto.CipherKey =
    process.env[keyEnvironmentVariable];

  public async getAll(): Promise<SecretDocument[]> {
    return await this.secretModel.find({}, this.hideValueProjection);
  }

  public async get(id: string): Promise<SecretDocument | null> {
    return await this.secretModel.findById(id, this.hideValueProjection);
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

    const secrets = await this.secretModel.find({
      name: { $eq: name },
      projectFilter,
    });

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
  ): Promise<Pick<SecretDocument, '_id' | 'name' | 'projectId'>> {
    const secret = await this.secretModel.create({
      name: name,
      projectId: projectId ? new Types.ObjectId(projectId) : undefined,
      value: SecretsService.encrypt(value),
    });

    secret.value = undefined;
    return secret;
  }

  public async delete(id: string) {
    return this.secretModel.deleteOne({ _id: { $eq: new Types.ObjectId(id) } });
  }

  public static decrypt(value: string): string {
    const values = value.split('$');
    const iv = Buffer.from(values[0], 'hex');
    const tag = Buffer.from(values[1], 'hex');
    const encrypted = values[2];
    const decipher = crypto.createDecipheriv(
      SecretsService.cipherType,
      SecretsService.key,
      iv,
    );
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }

  public static encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      SecretsService.cipherType,
      SecretsService.key,
      iv,
    );
    let encrypted = cipher.update(value, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}$${cipher
      .getAuthTag()
      .toString('hex')}$${encrypted}`;
  }

  public async deleteAllForProject(projectId: string) {
    return await this.secretModel.deleteMany({
      _id: { $eq: new Types.ObjectId(projectId) },
    });
  }
}
