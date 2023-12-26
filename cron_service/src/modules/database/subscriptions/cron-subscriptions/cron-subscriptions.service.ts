import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { E_TIMEOUT, Mutex, withTimeout } from 'async-mutex';
import { parseExpression } from 'cron-parser';
import { Model } from 'mongoose';
import { CronConnector } from '../../../connectors/cron.connector';
import {
  CronSubscription,
  CronSubscriptionsDocument,
} from './cron-subscriptions.model';

/**
 * This class is a singleton and should not be instanciated manually.
 */
@Injectable()
export class CronSubscriptionsService {
  private logger = new Logger(CronSubscriptionsService.name);
  private cronSubscriptionsCache: CronSubscriptionsDocument[] = [];
  private cacheMutex = withTimeout(
    new Mutex(),
    10000,
    new Error('Timed out while waiting for mutex.'),
  );
  private cacheUpdateRunning = false;
  private jobLaunchRunning = false;
  private lastJobLaunchStart = Date.now();

  /**
   * This class is a singleton and should not be instanciated manually
   */
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
      .select('_id name cronExpression');
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'Update cron cache',
  })
  public async updateSubscriptionCache() {
    if (this.cacheUpdateRunning) {
      this.logger.warn(
        'Cache update is already running, cancelling this update',
      );
      return;
    }
    this.cacheUpdateRunning = true;
    try {
      await this.cacheMutex.runExclusive(async () => {
        this.cronSubscriptionsCache = await this.getCronSubscriptions();
      });
    } catch (e) {
      if (e === E_TIMEOUT) {
        this.logger.error(
          'updateSubscriptionCache: Timeout while waiting for mutex',
        );
      }
      this.logger.error(e);
    } finally {
      this.cacheUpdateRunning = false;
    }
  }

  public static cronShouldRun(
    cronExpression: string,
    lastRunStart: number,
    currentRunStart: number,
  ): boolean {
    const parsedCron = parseExpression(cronExpression, {
      currentDate: new Date(currentRunStart),
    });
    const prevCronTime = parsedCron.prev().getTime();
    return lastRunStart <= prevCronTime && prevCronTime < currentRunStart;
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'Notify cron jobs',
  })
  public async notifyCronJobs() {
    if (this.jobLaunchRunning) {
      this.logger.warn('Cron notify is already running, cancelling this run');
      return;
    }
    this.jobLaunchRunning = true;

    try {
      await this.cacheMutex.runExclusive(async () => {
        const currentRunStart = Date.now();
        for (const subscription of this.cronSubscriptionsCache) {
          if (!subscription) {
            this.logger.error(
              'Failed to run the cron subscription as it is falsy',
            );
            continue;
          }

          try {
            if (
              CronSubscriptionsService.cronShouldRun(
                subscription.cronExpression,
                this.lastJobLaunchStart,
                currentRunStart,
              )
            ) {
              // Fire and forget
              this.cronConnector
                .notify(subscription._id.toString())
                .catch((reason) => {
                  this.logger.error(reason);
                  this.logger.error(
                    'Error while notifying the flow manager. Continuing...',
                  );
                });
            }
          } catch (e) {
            this.logger.error(e);
            this.logger.error(
              `Failed to run cron subscription with id '${subscription.id}', cron expression '${subscription.cronExpression}'`,
            );
          }
        }

        this.lastJobLaunchStart = currentRunStart;
      });
    } catch (e) {
      if (e === E_TIMEOUT) {
        this.logger.error('notifyCronJobs: Timeout while waiting for mutex');
      }
      this.logger.error(e);
    } finally {
      this.jobLaunchRunning = false;
    }
  }
}
