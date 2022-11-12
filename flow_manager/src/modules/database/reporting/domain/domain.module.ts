import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '../../admin/config/config.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { HostModule } from '../host/host.module';
import { ReportModule } from '../report/report.module';
import { DomainsController } from './domain.controller';
import { DomainsService } from './domain.service';

@Module({
  imports: [
    DatalayerModule,
    JobsModule,
    ReportModule,
    ConfigModule,
    forwardRef(() => HostModule),
  ],
  controllers: [DomainsController],
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
