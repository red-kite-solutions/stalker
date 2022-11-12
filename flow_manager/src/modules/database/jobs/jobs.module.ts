import { Module } from '@nestjs/common';
import { JobQueueModule } from '../../job-queue/job-queue.module';
import { DatalayerModule } from '../datalayer.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [JobQueueModule, DatalayerModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
