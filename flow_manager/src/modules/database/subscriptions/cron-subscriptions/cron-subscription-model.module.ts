import { MongooseModule } from '@nestjs/mongoose';
import { CronSubscriptionsSchema } from './cron-subscriptions.model';

export const CronSubscriptionModelModule = MongooseModule.forFeature([
  {
    name: 'cronSubscriptions',
    schema: CronSubscriptionsSchema,
  },
]);
