import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { JobsModule } from '../jobs/jobs.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { DomainsModule } from './domain/domain.module';
import { HostModule } from './host/host.module';

@Module({
  imports: [DatalayerModule, DomainsModule, HostModule, JobsModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
