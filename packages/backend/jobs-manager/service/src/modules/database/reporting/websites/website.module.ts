import { Module } from '@nestjs/common';
import { QueueModule } from '../../../job-queue/queue.module';
import { DatalayerModule } from '../../datalayer.module';
import { TagsModule } from '../../tags/tag.module';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';

@Module({
  imports: [DatalayerModule, TagsModule, QueueModule],
  controllers: [WebsiteController],
  providers: [WebsiteService],
  exports: [WebsiteService],
})
export class WebsiteModule {}
