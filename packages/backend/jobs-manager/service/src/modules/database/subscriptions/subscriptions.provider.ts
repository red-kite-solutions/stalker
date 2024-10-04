import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CronSubscription } from './cron-subscriptions/cron-subscriptions.model';
import { EventSubscription } from './event-subscriptions/event-subscriptions.model';
import { GitSubscriptionSource } from './subscription.source';

export const EVENT_SUBSCRIPTIONS_INIT = 'EVENT_SUBSCRIPTIONS_INIT';

export const subscriptionsInitProvider = [
  {
    provide: EVENT_SUBSCRIPTIONS_INIT,
    inject: [
      getModelToken('cronSubscriptions'),
      getModelToken('eventSubscriptions'),
    ],
    useFactory: async (
      cronSubscriptionModel: Model<CronSubscription>,
      eventSubscriptionModel: Model<EventSubscription>,
    ) => {
      const logger = new Logger('subscriptionsInitProvider');

      await cronSubscriptionModel.deleteMany({ builtIn: true });
      await eventSubscriptionModel.deleteMany({ builtIn: true });

      const subSources = [
        new GitSubscriptionSource(
          'https://github.com/red-kite-solutions/stalker-templates-community',
        ),
      ];

      for (const source of subSources) {
        const importedSubscriptions = await source.synchronize();
        for (const subscription of importedSubscriptions) {
          switch (subscription.triggerType) {
            case 'cron':
              cronSubscriptionModel.create(subscription);
              break;

            case 'event':
              eventSubscriptionModel.create(subscription);
              break;

            default:
              logger.warn(
                `Unknown subscription type ${subscription.triggerType}`,
              );
          }
        }
      }
    },
  },
];
