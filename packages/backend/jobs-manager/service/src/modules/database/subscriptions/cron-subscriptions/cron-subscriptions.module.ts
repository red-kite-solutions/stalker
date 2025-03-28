import { Module } from '@nestjs/common';
import { CustomJobNameExistsRule } from '../../../../validators/custom-job-name-exists.validator';
import { ConfigModule } from '../../admin/config/config.module';
import { CustomJobsModule } from '../../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { DomainsModule } from '../../reporting/domain/domain.module';
import { HostModule } from '../../reporting/host/host.module';
import { IpRangeModule } from '../../reporting/ip-ranges/ip-range.module';
import { PortModule } from '../../reporting/port/port.module';
import { ProjectModule } from '../../reporting/project.module';
import { WebsiteModule } from '../../reporting/websites/website.module';
import { SecretsModule } from '../../secrets/secrets.module';
import { SubscriptionTriggersModule } from '../subscription-triggers/subscription-triggers.module';
import { CronSubscriptionsController } from './cron-subscriptions.controller';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Module({
  imports: [
    DatalayerModule,
    CustomJobsModule,
    ConfigModule,
    ProjectModule,
    JobsModule,
    DomainsModule,
    HostModule,
    PortModule,
    SecretsModule,
    CustomJobsModule,
    WebsiteModule,
    SubscriptionTriggersModule,
    IpRangeModule,
  ],
  controllers: [CronSubscriptionsController],
  providers: [CronSubscriptionsService, CustomJobNameExistsRule],
  exports: [CronSubscriptionsService],
})
export class CronSubscriptionsModule {}
