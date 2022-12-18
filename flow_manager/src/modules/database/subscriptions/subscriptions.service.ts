import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
      companyId: new Types.ObjectId(dto.companyId),
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

  public async edit(id: string, dto: SubscriptionDto) {
    const sub: Subscription = {
      companyId: new Types.ObjectId(dto.companyId),
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

  public async delete(id: string) {
    return await this.subscriptionModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }

  public async getAllForFinding(companyId: string, finding: string) {
    return await this.subscriptionModel.find({
      companyId: { $eq: new Types.ObjectId(companyId) },
      finding: { $eq: finding },
    });
  }

  public async deleteAllForCompany(companyId: string) {
    return await this.subscriptionModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }
}
