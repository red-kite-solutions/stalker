import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { E_TIMEOUT, Mutex, withTimeout } from 'async-mutex';
import { Model } from 'mongoose';
import { cronShouldRun } from '../../../utils/cron.utils';
import { AlarmConnector } from '../../connectors/alarm.connector';
import { Alarm, AlarmDocument } from './alarm.model';

@Injectable()
export class AlarmService {
  /**
   * This class is a singleton and should not be instanciated manually
   */
  constructor(
    @InjectModel('alarms')
    private readonly alarmModel: Model<Alarm>,
    private readonly alarmConnector: AlarmConnector,
  ) {}

  private logger = new Logger(AlarmService.name);
  private alarmCache: AlarmDocument[] = [];
  private cacheMutex = withTimeout(
    new Mutex(),
    10000,
    new Error('Timed out while waiting for mutex.'),
  );
  private cacheUpdateRunning = false;
  private ringAlarmsRunning = false;
  private lastJobLaunchStart = Date.now();

  public async getAlarms() {
    return await this.alarmModel
      .find({})
      .select('_id name cronExpression isEnabled path');
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'Update alarm cache',
  })
  public async updateAlarmCache() {
    if (this.cacheUpdateRunning) {
      this.logger.warn(
        'Cache update is already running, cancelling this update',
      );
      return;
    }
    this.cacheUpdateRunning = true;
    try {
      await this.cacheMutex.runExclusive(async () => {
        this.alarmCache = await this.getAlarms();
      });
    } catch (e) {
      if (e === E_TIMEOUT) {
        this.logger.error('updateAlarmCache: Timeout while waiting for mutex');
      }
      this.logger.error(e);
    } finally {
      this.cacheUpdateRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'Notify alarms',
  })
  public async ringAlarms() {
    if (this.ringAlarmsRunning) {
      this.logger.warn('ringAlarms is already running, cancelling this run');
      return;
    }
    this.ringAlarmsRunning = true;

    try {
      await this.cacheMutex.runExclusive(async () => {
        const now = Date.now();
        for (const alarm of this.alarmCache) {
          try {
            this.ringAlarm(alarm, now);
          } catch (e) {
            this.logger.error(e);
            this.logger.error(
              `Failed to run alarm with id '${alarm._id}', cron expression '${alarm.cronExpression}'`,
            );
          }
        }

        this.lastJobLaunchStart = now;
      });
    } catch (e) {
      if (e === E_TIMEOUT) {
        this.logger.error('notifyCronJobs: Timeout while waiting for mutex');
      }
      this.logger.error(e);
    } finally {
      this.ringAlarmsRunning = false;
    }
  }

  private ringAlarm(alarm: AlarmDocument, now: number) {
    if (!alarm) {
      this.logger.error('Failed to ring the alarm as it is falsy');
      return;
    }

    const { path, cronExpression, isEnabled, name } = alarm;

    const shouldRun = cronShouldRun(
      cronExpression,
      this.lastJobLaunchStart,
      now,
    );
    if (!shouldRun) {
      return;
    }

    if (!isEnabled) {
      this.logger.debug(
        `Skipping execution for "${name}" because it is disabled.`,
      );
      return;
    }

    // Fire and forget
    this.alarmConnector.notify(path).catch((reason) => {
      this.logger.error(reason);
      this.logger.error(
        'Error while notifying the jobs manager. Continuing...',
      );
    });
  }
}
