import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSubscriptionsController } from './event-subscriptions.controller';
import { EventSubscriptionsSchema } from './event-subscriptions.model';
import { EventSubscriptionsService } from './event-subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'eventSubscriptions',
        schema: EventSubscriptionsSchema,
      },
    ]),
  ],
  controllers: [EventSubscriptionsController],
  providers: [EventSubscriptionsService],
  exports: [EventSubscriptionsService],
})
export class EventSubscriptionsModule {}
