import { forwardRef, Module } from '@nestjs/common';
import { QueueModule } from '../../../queues/queue.module';
import { ConfigModule } from '../../admin/config/config.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { TagsModule } from '../../tags/tag.module';
import { HostModule } from '../host/host.module';
import { WebsiteModule } from '../websites/website.module';
import { DomainsController } from './domain.controller';
import { DomainsService } from './domain.service';

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
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
