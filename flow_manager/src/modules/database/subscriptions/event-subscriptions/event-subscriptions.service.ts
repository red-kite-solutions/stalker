import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../../exceptions/http.exceptions';
import { CompanyUnassigned } from '../../../../validators/is-company-id.validator';
import { EVENT_SUBSCRIPTIONS_FILES_PATH } from '../subscriptions.constants';
import { SubscriptionsUtils } from '../subscriptions.utils';
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
      cooldown: dto.cooldown,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async getAll() {
    return await this.subscriptionModel.find({}, '-file');
  }

  public async edit(
    id: string,
    dto: EventSubscriptionDto,
  ): Promise<UpdateResult> {
    const sub: Partial<EventSubscription> = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      finding: dto.finding,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
      cooldown: dto.cooldown,
    };
    return await this.subscriptionModel.updateOne(
      { _id: { $eq: new Types.ObjectId(id) } },
      sub,
    );
  }

  public async revertToDefaults(id: string): Promise<UpdateResult> {
    const sub = await this.subscriptionModel.findById(new Types.ObjectId(id));
    if (!sub) {
      throw new HttpNotFoundException('Subscription not found');
    }

    if (!(sub.builtIn && sub.file)) {
      throw new HttpBadRequestException('Subscription not suitable for revert');
    }

    const defaultSub = SubscriptionsUtils.readEventSubscriptionFile(
      EVENT_SUBSCRIPTIONS_FILES_PATH,
      sub.file,
    );

    const subUpdate: Partial<EventSubscription> = {
      name: defaultSub.name,
      finding: defaultSub.finding,
      cooldown: defaultSub.cooldown,
      jobName: defaultSub.jobName,
      jobParameters: defaultSub.jobParameters,
      conditions: defaultSub.conditions,
    };

    return await this.subscriptionModel.updateOne(
      { _id: { $eq: sub._id } },
      subUpdate,
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
