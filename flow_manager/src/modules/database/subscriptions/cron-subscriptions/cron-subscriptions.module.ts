import { Module } from '@nestjs/common';
import { ConfigModule } from '../../admin/config/config.module';
import { CustomJobsModule } from '../../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../../datalayer.module';
import { CompanyModule } from '../../reporting/company.module';
import { CronSubscriptionsController } from './cron-subscriptions.controller';
import { cronSubscriptionsInitProvider } from './cron-subscriptions.provider';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Module({
  imports: [DatalayerModule, CustomJobsModule, ConfigModule, CompanyModule],
  controllers: [CronSubscriptionsController],
  providers: [CronSubscriptionsService, ...cronSubscriptionsInitProvider],
  exports: [CronSubscriptionsService, ...cronSubscriptionsInitProvider],
})
export class CronSubscriptionsModule {}
