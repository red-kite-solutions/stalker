import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QueueModule } from '../../job-queue/queue.module';
import { ConfigModule } from '../admin/config/config.module';
import { CustomJobsModule } from '../custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../datalayer.module';
import { SecretsModule } from '../secrets/secrets.module';
import { JobOutputGateway } from './job.gateway';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    QueueModule,
    DatalayerModule,
    CustomJobsModule,
    JwtModule,
    ConfigModule,
    SecretsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, JobOutputGateway],
  exports: [JobsService],
})
export class JobsModule {}
