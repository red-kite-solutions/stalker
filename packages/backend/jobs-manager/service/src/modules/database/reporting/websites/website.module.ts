import { Module } from '@nestjs/common';
import { QueueModule } from '../../../queues/queue.module';
import { DatalayerModule } from '../../datalayer.module';
import { TagsModule } from '../../tags/tag.module';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { WebsitesFilterParser } from './websites-filter-parser';

@Module({
  imports: [DatalayerModule, TagsModule, QueueModule],
  controllers: [WebsiteController],
  providers: [WebsiteService, WebsitesFilterParser],
  exports: [WebsiteService],
})
export class WebsiteModule {}
