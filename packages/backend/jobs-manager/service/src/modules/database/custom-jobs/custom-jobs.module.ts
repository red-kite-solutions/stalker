import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataSourcesModule } from '../../datasources/data-sources.module';
import { QueueModule } from '../../job-queue/queue.module';
import { ConfigService } from '../admin/config/config.service';
import { DatalayerModule } from '../datalayer.module';
import { CustomJobsController } from './custom-jobs.controller';
import { CustomJobsSchema } from './custom-jobs.model';
import { CustomJobsService } from './custom-jobs.service';
import { jobsInitProvider } from './jobs.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'customJobs',
        schema: CustomJobsSchema,
      },
    ]),
    DatalayerModule,
    QueueModule,
    DataSourcesModule,
  ],
  controllers: [CustomJobsController],
  providers: [CustomJobsService, ConfigService, ...jobsInitProvider],
  exports: [CustomJobsService, ...jobsInitProvider],
})
export class CustomJobsModule {}
