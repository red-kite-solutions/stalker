import { forwardRef, Module } from '@nestjs/common';
import { QueueModule } from '../../../job-queue/queue.module';
import { ConfigModule } from '../../admin/config/config.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { TagsModule } from '../../tags/tag.module';
import { DomainsModule } from '../domain/domain.module';
import { PortModule } from '../port/port.module';
import { WebsiteModule } from '../websites/website.module';
import { HostsFilterParser } from './host-filter-parser';
import { HostController } from './host.controller';
import { HostService } from './host.service';

@Module({
  imports: [
    DatalayerModule,
    JobsModule,
    ConfigModule,
    TagsModule,
    QueueModule,
    forwardRef(() => DomainsModule),
    PortModule,
    WebsiteModule,
  ],
  controllers: [HostController],
  providers: [HostService, HostsFilterParser],
  exports: [HostService, HostsFilterParser],
})
export class HostModule {}
