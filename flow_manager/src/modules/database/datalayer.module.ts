import { Module } from '@nestjs/common';
import { ConfigModelModule } from './admin/config/config-model.module';
import { databaseConfigInitProvider } from './admin/config/config.provider';
import { JobModelModule } from './jobs/job-model.module';
import { CompanyModelModule } from './reporting/company-model.module';
import { DomainModelModule } from './reporting/domain/domain-model.module';
import { FindingModelModule } from './reporting/findings/findings-model.module';
import { HostModelModule } from './reporting/host/host-model.module';
import { PortModelModule } from './reporting/port/port-model.module';
import { ReportModelModule } from './reporting/report/report-model.module';
import { TagModelModule } from './tags/tag-model.module';

@Module({
  imports: [
    HostModelModule,
    JobModelModule,
    ReportModelModule,
    ConfigModelModule,
    TagModelModule,
    CompanyModelModule,
    DomainModelModule,
    FindingModelModule,
    PortModelModule,
  ],
  providers: [...databaseConfigInitProvider],
  exports: [
    ...databaseConfigInitProvider,
    HostModelModule,
    ConfigModelModule,
    JobModelModule,
    ReportModelModule,
    TagModelModule,
    CompanyModelModule,
    FindingModelModule,
    PortModelModule,
    DomainModelModule,
  ],
})
export class DatalayerModule {}
