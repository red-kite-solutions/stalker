import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Mutex } from 'async-mutex';
import { parseExpression } from 'cron-parser';
import { Model } from 'mongoose';
import { CronConnector } from '../../../connectors/cron.connector';
import {
  CronSubscription,
  CronSubscriptionsDocument,
} from './cron-subscriptions.model';

@Injectable()
export class CronSubscriptionsService {
  private cronSubscriptionsCache: CronSubscriptionsDocument[] = [];
  private cacheMutex = new Mutex();
  private cacheUpdateRunning = false;
  private jobLaunchRunning = false;
  private lastJobLaunchStart = Math.floor(Date.now() / 1000);

  constructor(
    @InjectModel('cronSubscriptions')
    private readonly cronSubscriptionsModel: Model<CronSubscription>,
    private readonly cronConnector: CronConnector,
  ) {
    this.updateSubscriptionCache();
  }

  public async getCronSubscriptions() {
    return await this.cronSubscriptionsModel
      .find({})
      .select('_id name cronExpression lastRun');
  }

  // @Cron(CronExpression.EVERY_5_MINUTES)
  @Cron(CronExpression.EVERY_MINUTE)
  public async updateSubscriptionCache() {
    if (this.cacheUpdateRunning) {
      console.log('Cache update is already running, cancelling this update');
      return;
    }
    this.cacheUpdateRunning = true;
    try {
      await this.cacheMutex.runExclusive(async () => {
        this.cronSubscriptionsCache = await this.getCronSubscriptions();
        console.log('delete me: Cache update done'); // TODO: delete, maybe better logs
      });
    } finally {
      this.cacheUpdateRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async launchRelevantJobs() {
    if (this.jobLaunchRunning) {
      console.log('Job launch is already running, cancelling this run');
      return;
    }
    this.jobLaunchRunning = true;

    try {
      await this.cacheMutex.runExclusive(async () => {
        const currentRunStart = Date.now();
        for (const subscription of this.cronSubscriptionsCache) {
          try {
            const parsedCron = parseExpression(subscription.cronExpression, {
              currentDate: new Date(currentRunStart),
            });
            const lastRunTime = parsedCron.prev().toDate().getTime();
            console.log('Will it run?'); // TODO: delete
            if (
              this.lastJobLaunchStart < lastRunTime &&
              lastRunTime <= currentRunStart
            ) {
              console.log('Running the job!!'); // TODO: delete

              // Fire and forget
              this.cronConnector.notify(subscription._id.toString());
            }
          } catch (e) {
            if (subscription)
              console.log(
                `Failed to run cron subscription with id '${subscription.id}', cron expression '${subscription.cronExpression}'`,
              );
            else console.log('Failed to run cron subscription and is it falsy');

            console.log(e);
          }
        }

        this.lastJobLaunchStart = currentRunStart;
      });
    } finally {
      this.jobLaunchRunning = false;
    }
  }
}
