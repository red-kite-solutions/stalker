import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomJobNameExistsRule } from '../../../../validators/custom-job-name-exists.validator';
import { CustomJobsModule } from '../../custom-jobs/custom-jobs.module';
import { EventSubscriptionsController } from './event-subscriptions.controller';
import { EventSubscriptionsSchema } from './event-subscriptions.model';
import { eventSubscriptionsInitProvider } from './event-subscriptions.provider';
import { EventSubscriptionsService } from './event-subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'eventSubscriptions',
        schema: EventSubscriptionsSchema,
      },
    ]),
    CustomJobsModule,
  ],
  controllers: [EventSubscriptionsController],
  providers: [
    EventSubscriptionsService,
    ...eventSubscriptionsInitProvider,
    CustomJobNameExistsRule,
  ],
  exports: [EventSubscriptionsService, ...eventSubscriptionsInitProvider],
})
export class EventSubscriptionsModule {}
