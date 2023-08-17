import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronSubscriptionsController } from './subscriptions/cron-subscriptions.controller';
import { CronSubscriptionsSchema } from './subscriptions/cron-subscriptions.model';
import { CronSubscriptionsService } from './subscriptions/cron-subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'cronSubscriptions',
        schema: CronSubscriptionsSchema,
      },
    ]),
  ],
  controllers: [CronSubscriptionsController],
  providers: [CronSubscriptionsService],
})
export class CronModule {}
