import { forwardRef, Module } from '@nestjs/common';
import { QueueModule } from '../../../job-queue/queue.module';
import { ConfigModule } from '../../admin/config/config.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { TagsModule } from '../../tags/tag.module';
import { DomainsModule } from '../domain/domain.module';
import { PortModule } from '../port/port.module';
import { ReportModule } from '../report/report.module';
import { HostController } from './host.controller';
import { HostService } from './host.service';

@Module({
  imports: [
    DatalayerModule,
    JobsModule,
    ReportModule,
    ConfigModule,
    TagsModule,
    QueueModule,
    forwardRef(() => DomainsModule),
    PortModule,
  ],
  controllers: [HostController],
  providers: [HostService],
  exports: [HostService],
})
export class HostModule {}
