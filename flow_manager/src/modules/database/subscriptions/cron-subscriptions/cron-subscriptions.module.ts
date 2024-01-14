import { Module } from '@nestjs/common';
import { ConfigModule } from '../../admin/config/config.module';
import { CustomJobsModule } from '../../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { CompanyModule } from '../../reporting/company.module';
import { DomainsModule } from '../../reporting/domain/domain.module';
import { HostModule } from '../../reporting/host/host.module';
import { PortModule } from '../../reporting/port/port.module';
import { CronSubscriptionsController } from './cron-subscriptions.controller';
import { cronSubscriptionsInitProvider } from './cron-subscriptions.provider';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Module({
  imports: [
    DatalayerModule,
    CustomJobsModule,
    ConfigModule,
    CompanyModule,
    JobsModule,
    DomainsModule,
    HostModule,
    PortModule,
  ],
  controllers: [CronSubscriptionsController],
  providers: [CronSubscriptionsService, ...cronSubscriptionsInitProvider],
  exports: [CronSubscriptionsService, ...cronSubscriptionsInitProvider],
})
export class CronSubscriptionsModule {}
