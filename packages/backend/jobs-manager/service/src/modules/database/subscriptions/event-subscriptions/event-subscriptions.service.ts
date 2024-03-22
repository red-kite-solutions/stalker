import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../../exceptions/http.exceptions';
import { ProjectUnassigned } from '../../../../validators/is-project-id.validator';
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
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      isEnabled: true,
      name: dto.name,
      finding: dto.finding,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
      cooldown: dto.cooldown,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async updateEnabled(id: string, enabled: boolean) {
    const subUpdate: Partial<EventSubscription> = {
      isEnabled: enabled,
    };

    return await this.subscriptionModel.updateOne<EventSubscription>(
      { _id: { $eq: new Types.ObjectId(id) } },
      subUpdate,
    );
  }

  public async get(id: string) {
    return await this.subscriptionModel.findOne({ _id: id }, '-file');
  }

  public async getAll() {
    return await this.subscriptionModel.find({}, '-file');
  }

  public async edit(
    id: string,
    dto: EventSubscriptionDto,
  ): Promise<UpdateResult> {
    const sub: Partial<EventSubscription> = {
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
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

  public async getAllForFinding(projectId: string, finding: string) {
    if (projectId === ProjectUnassigned) return [];

    return await this.subscriptionModel.find({
      $or: [
        { projectId: { $eq: new Types.ObjectId(projectId) } },
        { projectId: null },
      ],
      finding: { $eq: finding },
    });
  }

  public async deleteAllForProject(projectId: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(projectId) },
    });
  }
}
