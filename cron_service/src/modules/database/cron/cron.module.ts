import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConnectorModule } from '../../connectors/connector.module';
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
    ScheduleModule.forRoot(),
    ConnectorModule,
  ],
  controllers: [CronSubscriptionsController],
  providers: [CronSubscriptionsService],
})
export class CronModule {}
