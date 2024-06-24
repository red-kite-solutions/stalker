import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { CorrelationKeyUtils } from '../../reporting/correlation.utils';
import { DomainsService } from '../../reporting/domain/domain.service';
import { HostService } from '../../reporting/host/host.service';
import { PortService } from '../../reporting/port/port.service';
import {
  SubscriptionTrigger,
  SubscriptionTriggerDocument,
} from './subscription-triggers.model';

@Injectable()
export class SubscriptionTriggersService {
  private logger = new Logger(SubscriptionTriggersService.name);

  constructor(
    @InjectModel('subscriptionTriggers')
    private readonly subscriptionTriggerModel: Model<SubscriptionTrigger>,
    private readonly hostsService: HostService,
    private readonly domainsService: DomainsService,
    private readonly portsService: PortService,
  ) {}

  public async isTriggerBlocked(correlationKey: string): Promise<boolean> {
    const serviceName =
      CorrelationKeyUtils.getResourceServiceName(correlationKey);

    switch (serviceName) {
      case 'PortService':
        return await this.portsService.keyIsBlocked(correlationKey);
      case 'DomainsService':
        return await this.domainsService.keyIsBlocked(correlationKey);
      case 'HostService':
        return await this.hostsService.keyIsBlocked(correlationKey);
      default:
        return false;
    }
  }

  /**
   * The function attempts to trigger a `SubscriptionTrigger`. It will succeed if the interval since the last trigger is
   * greater than the `subscriptionCooldown`, or if it was never triggered. This method is thread safe.
   *
   * The success of the trigger should dictate if a job is started.
   * @param subscriptionId The subscription to trigger
   * @param correlationKey The correlation key for which to trigger
   * @param subscriptionCooldown The time to wait between triggers for the subscription (seconds)
   * @returns true if the trigger attempt worked, false otherwise. If true is returned, a job can be started.
   */
  public async attemptTrigger(
    subscriptionId: string,
    correlationKey: string,
    subscriptionCooldown: number,
  ): Promise<boolean> {
    if (await this.isTriggerBlocked(correlationKey)) return false;

    const subId = new Types.ObjectId(subscriptionId);

    let triggerSuccess = false;
    const now = Date.now();
    const subscriptionCooldownMilliseconds = subscriptionCooldown * 1000;
    const session = await this.subscriptionTriggerModel.startSession();

    try {
      await session.withTransaction(async () => {
        const s = await this.subscriptionTriggerModel.findOne(
          {
            subscriptionId: subId,
            correlationKey: correlationKey,
          },
          undefined,
          { session },
        );
        if (s) {
          if (now - s.lastTrigger >= subscriptionCooldownMilliseconds) {
            await this.subscriptionTriggerModel.findOneAndUpdate(
              { _id: { $eq: s._id } },
              { lastTrigger: now },
              { session },
            );
            triggerSuccess = true;
          }
        } else {
          await this.subscriptionTriggerModel.create(
            [
              {
                subscriptionId: subId,
                correlationKey: correlationKey,
                lastTrigger: now,
              },
            ],
            { session },
          );
          triggerSuccess = true;
        }
      });
    } finally {
      await session.endSession();
    }
    return triggerSuccess;
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.subscriptionTriggerModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }

  public async getAll(): Promise<SubscriptionTriggerDocument[]> {
    return await this.subscriptionTriggerModel.find({});
  }

  public async deleteAllForSubscription(subscriptionId: string) {
    await this.subscriptionTriggerModel.deleteMany({
      subscriptionId: { $eq: new Types.ObjectId(subscriptionId) },
    });
  }

  public async deleteAllForProject(projectId: string) {
    const r = new RegExp(`^project\:${projectId}`);
    await this.subscriptionTriggerModel.deleteMany({
      correlationKey: { $regex: r },
    });
  }
}
