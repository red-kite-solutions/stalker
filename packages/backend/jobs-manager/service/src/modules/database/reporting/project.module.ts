import { Module } from '@nestjs/common';
import { ConfigModule } from '../admin/config/config.module';
import { CustomJobsModule } from '../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../datalayer.module';
import { JobsModule } from '../jobs/jobs.module';
import { SecretsModule } from '../secrets/secrets.module';
import { EventSubscriptionsModule } from '../subscriptions/event-subscriptions/event-subscriptions.module';
import { SubscriptionTriggersModule } from '../subscriptions/subscription-triggers/subscription-triggers.module';
import { DomainsModule } from './domain/domain.module';
import { HostModule } from './host/host.module';
import { IpRangeModule } from './ip-ranges/ip-range.module';
import { PortModule } from './port/port.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { WebsiteModule } from './websites/website.module';

@Module({
  imports: [
    DatalayerModule,
    DomainsModule,
    HostModule,
    JobsModule,
    EventSubscriptionsModule,
    CustomJobsModule,
    PortModule,
    ConfigModule,
    SecretsModule,
    WebsiteModule,
    SubscriptionTriggersModule,
    IpRangeModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
