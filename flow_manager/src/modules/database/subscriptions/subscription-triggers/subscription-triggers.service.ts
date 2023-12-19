import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
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
  ) {}

  /**
   * The function attempts to trigger a `SubscriptionTrigger`. It will succeed if the interval since the last trigger is
   * greater than the `subscriptionTriggerInterval`, or if it was never triggered. This method is thread safe.
   *
   * The success of the trigger should dictate if a job is started.
   * @param subscriptionId The subscription to trigger
   * @param correlationKey The correlation key for which to trigger
   * @param subscriptionTriggerInterval The time to wait between triggers for the subscription (seconds)
   * @returns true if the trigger attempt worked, false otherwise. If true is returned, a job can be started.
   */
  public async attemptTrigger(
    subscriptionId: string,
    correlationKey: string,
    subscriptionTriggerInterval: number,
  ): Promise<boolean> {
    const subId = new Types.ObjectId(subscriptionId);

    let triggerSuccess = false;
    const now = Date.now();
    const subscriptionTriggerIntervalSeconds =
      subscriptionTriggerInterval * 1000;
    const session = await this.subscriptionTriggerModel.startSession();

    try {
      await session.withTransaction(async () => {
        const s = await this.subscriptionTriggerModel.findOne({
          subscriptionId: subId,
          correlationKey: correlationKey,
        });
        if (s) {
          if (now - s.lastTrigger >= subscriptionTriggerIntervalSeconds) {
            await this.subscriptionTriggerModel.findOneAndUpdate(
              { _id: { $eq: s._id } },
              { lastTrigger: now },
            );
            triggerSuccess = true;
          }
        } else {
          await this.subscriptionTriggerModel.create({
            subscriptionId: subId,
            correlationKey: correlationKey,
            lastTrigger: now,
          });
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
}
