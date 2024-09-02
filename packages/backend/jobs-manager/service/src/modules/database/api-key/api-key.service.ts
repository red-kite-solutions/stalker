import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../exceptions/http.exceptions';
import { Role } from '../../auth/constants';
import { User } from '../users/users.model';
import { ApiKey, ApiKeyDocument } from './api-key.model';
import { ApiKeyFilterModel } from './api-key.types';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel('apikey')
    private readonly apiKeyModel: Model<ApiKey>,
    @InjectModel('users') private readonly userModel: Model<User>,
  ) {}

  public async create(
    name: string,
    userId: string,
    role: Role,
    expiresAt: number,
  ): Promise<ApiKeyDocument> {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(userId),
    });

    if (!user) throw new HttpNotFoundException(userId);

    if (!user.active)
      throw new HttpBadRequestException(
        'Cannot create API key for deactivated user',
      );

    const key = randomUUID();
    return await this.apiKeyModel.create({
      name: name,
      expiresAt: expiresAt,
      key: key,
      role: role,
      userId: new Types.ObjectId(userId),
      active: true,
      userIsActive: true,
    });
  }

  public async findValidApiKey(key: string) {
    const now = Date.now();
    const apiKey = await this.apiKeyModel.findOne({
      key: { $eq: key },
      expiresAt: { $gt: now },
      active: { $eq: true },
      userIsActive: { $eq: true },
    });

    return apiKey;
  }

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: ApiKeyFilterModel = null,
  ): Promise<ApiKeyDocument[]> {
    let query;
    if (filter) {
      query = this.apiKeyModel.find(this.buildFilters(filter));
    } else {
      query = this.apiKeyModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async getById(
    id: string,
    userId: string = undefined,
  ): Promise<ApiKeyDocument> {
    if (userId) {
      return await this.apiKeyModel.findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      });
    }
    return await this.apiKeyModel.findById(id);
  }

  public async delete(id: string, userId: string = undefined) {
    const filter: FilterQuery<ApiKeyDocument> = {
      _id: new Types.ObjectId(id),
    };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    return await this.apiKeyModel.deleteOne(filter);
  }

  public async deleteAllForUser(userId: string) {
    return await this.apiKeyModel.deleteMany({
      userId: { $eq: new Types.ObjectId(userId) },
    });
  }

  public buildFilters(filter: ApiKeyFilterModel): FilterQuery<ApiKeyDocument> {
    return { userId: { $eq: new Types.ObjectId(filter.userId) } };
  }

  /**
   * Marks a user's keys as active/inactive. Has to match the user's "active" value.
   * For an api key to be active, its "userIsActive" and "active" values both have to be true.
   * @param userId The user for which to edit the keys
   * @param activate Whether the user is active and therefore its keys should be identified as so.
   * @returns
   */
  public async setUserIsActiveStatus(userId: string, activate: boolean) {
    return await this.apiKeyModel.updateMany(
      {
        userId: { $eq: new Types.ObjectId(userId) },
      },
      { $set: { userIsActive: activate } },
    );
  }
}
