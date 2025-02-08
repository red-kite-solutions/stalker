import { forwardRef, Module } from '@nestjs/common';
import { QueueModule } from '../../../job-queue/queue.module';
import { ConfigModule } from '../../admin/config/config.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { TagsModule } from '../../tags/tag.module';
import { HostModule } from '../host/host.module';
import { WebsiteModule } from '../websites/website.module';
import { DomainsController } from './domain.controller';
import { DomainsService } from './domain.service';
import { DomainsFilterParser } from './domains-filter-parser';

@Module({
  imports: [
    DatalayerModule,
    JobsModule,
    ConfigModule,
    forwardRef(() => HostModule),
    QueueModule,
    TagsModule,
    WebsiteModule,
  ],
  controllers: [DomainsController],
  providers: [DomainsService, DomainsFilterParser],
  exports: [DomainsService, DomainsFilterParser],
})
export class DomainsModule {}
