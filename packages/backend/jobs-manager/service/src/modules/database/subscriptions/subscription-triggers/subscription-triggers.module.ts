import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DomainsModule } from '../../reporting/domain/domain.module';
import { HostModule } from '../../reporting/host/host.module';
import { PortModule } from '../../reporting/port/port.module';
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
    HostModule,
    DomainsModule,
    PortModule,
  ],
  controllers: [SubscriptionTriggersController],
  providers: [SubscriptionTriggersService],
  exports: [SubscriptionTriggersService],
})
export class SubscriptionTriggersModule {}
