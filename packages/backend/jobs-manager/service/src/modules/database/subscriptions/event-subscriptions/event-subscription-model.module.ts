import { MongooseModule } from '@nestjs/mongoose';
import { EventSubscriptionsSchema } from './event-subscriptions.model';

export const EventSubscriptionModelModule = MongooseModule.forFeature([
  {
    name: 'eventSubscriptions',
    schema: EventSubscriptionsSchema,
  },
]);
