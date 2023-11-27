import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscription } from './cron-subscriptions.model';

@Injectable()
export class CronSubscriptionsService {
  private logger = new Logger(CronSubscriptionsService.name);

  constructor(
    @InjectModel('cronSubscriptions')
    private readonly subscriptionModel: Model<CronSubscription>,
  ) {}

  public async create(dto: CronSubscriptionDto) {
    const sub: CronSubscription = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async getAll() {
    return await this.subscriptionModel.find({});
  }

  public async edit(
    id: string,
    dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    const sub: CronSubscription = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
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

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }
}
