import { Module } from '@nestjs/common';
import { QueueModule } from '../../job-queue/queue.module';
import { DatalayerModule } from '../datalayer.module';
import { JobOutputGateway } from './job.gateway';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [QueueModule, DatalayerModule],
  controllers: [JobsController],
  providers: [JobsService, JobOutputGateway],
  exports: [JobsService],
})
export class JobsModule {}
