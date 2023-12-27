import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readdirSync } from 'node:fs';
import { CRON_SUBSCRIPTIONS_FILES_PATH } from '../subscriptions.constants';
import { SubscriptionsUtils } from '../subscriptions.utils';
import { CronSubscription } from './cron-subscriptions.model';

export const EVENT_SUBSCRIPTIONS_INIT = 'EVENT_SUBSCRIPTIONS_INIT';

export const cronSubscriptionsInitProvider = [
  {
    provide: EVENT_SUBSCRIPTIONS_INIT,
    inject: [getModelToken('cronSubscriptions')],
    useFactory: async (subscriptionModel: Model<CronSubscription>) => {
      const anySub = await subscriptionModel.findOne({});
      if (anySub) return;

      const files = readdirSync(CRON_SUBSCRIPTIONS_FILES_PATH);
      for (const file of files) {
        const sub = SubscriptionsUtils.readCronSubscriptionFile(
          CRON_SUBSCRIPTIONS_FILES_PATH,
          file,
        );
        if (sub) await subscriptionModel.create(sub);
      }
    },
  },
];
