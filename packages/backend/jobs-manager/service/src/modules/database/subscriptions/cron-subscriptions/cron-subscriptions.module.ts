import { Module } from '@nestjs/common';
import { CustomJobNameExistsRule } from '../../../../validators/custom-job-name-exists.validator';
import { ConfigModule } from '../../admin/config/config.module';
import { CustomJobsModule } from '../../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { DomainsModule } from '../../reporting/domain/domain.module';
import { HostModule } from '../../reporting/host/host.module';
import { PortModule } from '../../reporting/port/port.module';
import { ProjectModule } from '../../reporting/project.module';
import { WebsiteModule } from '../../reporting/websites/website.module';
import { SecretsModule } from '../../secrets/secrets.module';
import { CronSubscriptionsController } from './cron-subscriptions.controller';
import { cronSubscriptionsInitProvider } from './cron-subscriptions.provider';
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
  ],
  controllers: [CronSubscriptionsController],
  providers: [
    CronSubscriptionsService,
    ...cronSubscriptionsInitProvider,
    CustomJobNameExistsRule,
  ],
  exports: [CronSubscriptionsService, ...cronSubscriptionsInitProvider],
})
export class CronSubscriptionsModule {}
