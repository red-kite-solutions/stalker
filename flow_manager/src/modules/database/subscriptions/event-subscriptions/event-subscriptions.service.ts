import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { CompanyUnassigned } from '../../../../validators/is-company-id.validator';
import { EventSubscriptionDto } from './event-subscriptions.dto';
import { EventSubscription } from './event-subscriptions.model';

@Injectable()
export class EventSubscriptionsService {
  private logger = new Logger(EventSubscriptionsService.name);

  constructor(
    @InjectModel('eventSubscriptions')
    private readonly subscriptionModel: Model<EventSubscription>,
  ) {}

  public async create(dto: EventSubscriptionDto) {
    const sub: EventSubscription = {
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

  public async edit(
    id: string,
    dto: EventSubscriptionDto,
  ): Promise<UpdateResult> {
    const sub: EventSubscription = {
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
