import { Module } from '@nestjs/common';
import { CustomJobsModule } from '../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../datalayer.module';
import { JobsModule } from '../jobs/jobs.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { DomainsModule } from './domain/domain.module';
import { HostModule } from './host/host.module';

@Module({
  imports: [
    DatalayerModule,
    DomainsModule,
    HostModule,
    JobsModule,
    SubscriptionsModule,
    CustomJobsModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
