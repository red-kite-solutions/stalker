import { Module } from '@nestjs/common';
import { ConfigModule } from '../admin/config/config.module';
import { CustomJobsModule } from '../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../datalayer.module';
import { JobsModule } from '../jobs/jobs.module';
import { EventSubscriptionsModule } from '../subscriptions/event-subscriptions/event-subscriptions.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { DomainsModule } from './domain/domain.module';
import { HostModule } from './host/host.module';
import { PortModule } from './port/port.module';

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
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
