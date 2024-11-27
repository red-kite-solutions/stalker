import { Module } from '@nestjs/common';
import { CustomJobNameExistsRule } from '../../../../validators/custom-job-name-exists.validator';
import { CustomJobsModule } from '../../custom-jobs/custom-jobs.module';
import { SubscriptionTriggersModule } from '../subscription-triggers/subscription-triggers.module';
import { EventSubscriptionModelModule } from './event-subscription-model.module';
import { EventSubscriptionsController } from './event-subscriptions.controller';
import { EventSubscriptionsService } from './event-subscriptions.service';

@Module({
  imports: [
    EventSubscriptionModelModule,
    CustomJobsModule,
    SubscriptionTriggersModule,
  ],
  controllers: [EventSubscriptionsController],
  providers: [EventSubscriptionsService, CustomJobNameExistsRule],
  exports: [EventSubscriptionsService],
})
export class EventSubscriptionsModule {}
