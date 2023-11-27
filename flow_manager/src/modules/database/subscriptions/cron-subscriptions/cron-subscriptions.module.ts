import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronSubscriptionsController } from './cron-subscriptions.controller';
import { CronSubscriptionsSchema } from './cron-subscriptions.model';
import { CronSubscriptionsService } from './cron-subscriptions.service';

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
  exports: [CronSubscriptionsService],
})
export class CronSubscriptionsModule {}
