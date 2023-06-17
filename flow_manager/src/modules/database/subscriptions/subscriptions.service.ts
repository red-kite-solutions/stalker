import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { CompanyUnassigned } from '../../../validators/is-company-id.validator';
import { SubscriptionDto } from './subscriptions.dto';
import { Subscription } from './subscriptions.model';

@Injectable()
export class SubscriptionsService {
  private logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel('subscriptions')
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  public async create(dto: SubscriptionDto) {
    const sub: Subscription = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      finding: dto.finding,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async getAll() {
    return await this.subscriptionModel.find({});
  }

  public async edit(id: string, dto: SubscriptionDto): Promise<UpdateResult> {
    const sub: Subscription = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      finding: dto.finding,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
    };
    return await this.subscriptionModel.updateOne(
      { _id: { $eq: new Types.ObjectId(id) } },
      sub,
    );
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }

  public async getAllForFinding(companyId: string, finding: string) {
    if (companyId === CompanyUnassigned) return [];

    return await this.subscriptionModel.find({
      $or: [
        { companyId: { $eq: new Types.ObjectId(companyId) } },
        { companyId: null },
      ],
      finding: { $eq: finding },
    });
  }

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }
}
