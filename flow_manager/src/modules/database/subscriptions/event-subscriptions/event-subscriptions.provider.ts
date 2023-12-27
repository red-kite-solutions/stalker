import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readdirSync } from 'node:fs';
import { EVENT_SUBSCRIPTIONS_FILES_PATH } from '../subscriptions.constants';
import { SubscriptionsUtils } from '../subscriptions.utils';
import { EventSubscription } from './event-subscriptions.model';

export const EVENT_SUBSCRIPTIONS_INIT = 'EVENT_SUBSCRIPTIONS_INIT';

export const eventSubscriptionsInitProvider = [
  {
    provide: EVENT_SUBSCRIPTIONS_INIT,
    inject: [getModelToken('eventSubscriptions')],
    useFactory: async (subscriptionModel: Model<EventSubscription>) => {
      const anySub = await subscriptionModel.findOne({});
      if (anySub) return;

      const files = readdirSync(EVENT_SUBSCRIPTIONS_FILES_PATH);
      for (const file of files) {
        const sub = SubscriptionsUtils.readEventSubscriptionFile(
          EVENT_SUBSCRIPTIONS_FILES_PATH,
          file,
        );
        if (sub) await subscriptionModel.create(sub);
      }
    },
  },
];
