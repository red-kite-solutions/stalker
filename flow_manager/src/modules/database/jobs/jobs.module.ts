import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QueueModule } from '../../job-queue/queue.module';
import { CustomJobsModule } from '../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../datalayer.module';
import { JobOutputGateway } from './job.gateway';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [QueueModule, DatalayerModule, CustomJobsModule, JwtModule],
  controllers: [JobsController],
  providers: [JobsService, JobOutputGateway],
  exports: [JobsService],
})
export class JobsModule {}
