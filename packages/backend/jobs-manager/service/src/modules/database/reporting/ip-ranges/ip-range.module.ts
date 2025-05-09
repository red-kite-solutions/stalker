import { Module } from '@nestjs/common';
import { QueueModule } from '../../../queues/queue.module';
import { DatalayerModule } from '../../datalayer.module';
import { JobsModule } from '../../jobs/jobs.module';
import { TagsModule } from '../../tags/tag.module';
import { IpRangeController } from './ip-range.controller';
import { IpRangeService } from './ip-range.service';

@Module({
  imports: [DatalayerModule, JobsModule, TagsModule, QueueModule],
  controllers: [IpRangeController],
  providers: [IpRangeService],
  exports: [IpRangeService],
})
export class IpRangeModule {}
