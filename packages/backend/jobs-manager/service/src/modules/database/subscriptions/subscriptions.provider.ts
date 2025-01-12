import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UpdateFilter } from 'mongodb';
import { Model } from 'mongoose';
import { isConsumerMode } from '../../app.constants';
import { DataSources } from '../../datasources/data-sources';
import { GitDataSourceConfig } from '../../datasources/git-data-source';
import { CronSubscription } from './cron-subscriptions/cron-subscriptions.model';
import { EventSubscription } from './event-subscriptions/event-subscriptions.model';
import {
  GitSubscriptionSource,
  SubscriptionSource,
} from './subscription.source';

export const EVENT_SUBSCRIPTIONS_INIT = 'EVENT_SUBSCRIPTIONS_INIT';

export const subscriptionsInitProvider = [
  {
    provide: EVENT_SUBSCRIPTIONS_INIT,
    inject: [
      getModelToken('cronSubscriptions'),
      getModelToken('eventSubscriptions'),
      DataSources,
    ],
    useFactory: async (
      cronSubscriptionModel: Model<CronSubscription>,
      eventSubscriptionModel: Model<EventSubscription>,
      dataSources: DataSources,
    ) => {
      if (isConsumerMode()) return;
      const logger = new Logger('subscriptionsInitProvider');

      try {
        const sourceConfigs: GitDataSourceConfig[] =
          process.env.DATA_SOURCES != null
            ? JSON.parse(process.env.DATA_SOURCES) ?? undefined
            : [];

        const sources: SubscriptionSource[] = [];
        for (const source of sourceConfigs) {
          const dataSource = await dataSources.get(source);
          sources.push(new GitSubscriptionSource(dataSource));
        }

        for (const source of sources) {
          const importedSubscriptions = await source.synchronize();
          for (const subscription of importedSubscriptions) {
            const filter: UpdateFilter<CronSubscription | EventSubscription> = {
              jobName: subscription.jobName,
              'source.repoUrl': subscription.source?.repoUrl,
            };

            switch (subscription.triggerType) {
              case 'cron':
                await cronSubscriptionModel.updateOne(filter, subscription, {
                  upsert: true,
                });
                break;

              case 'event':
                await eventSubscriptionModel.updateOne(filter, subscription, {
                  upsert: true,
                });
                break;

              default:
                logger.warn(
                  `Unknown subscription type ${subscription.triggerType}`,
                );
            }
          }
        }
      } catch (e) {
        logger.error(e);
      }
    },
  },
];
