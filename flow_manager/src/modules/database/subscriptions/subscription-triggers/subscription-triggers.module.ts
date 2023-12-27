import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionTriggersController } from './subscription-triggers.controller';
import { SubscriptionTriggerSchema } from './subscription-triggers.model';
import { SubscriptionTriggersService } from './subscription-triggers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'subscriptionTriggers',
        schema: SubscriptionTriggerSchema,
      },
    ]),
  ],
  controllers: [SubscriptionTriggersController],
  providers: [SubscriptionTriggersService],
  exports: [SubscriptionTriggersService],
})
export class SubscriptionTriggersModule {}
