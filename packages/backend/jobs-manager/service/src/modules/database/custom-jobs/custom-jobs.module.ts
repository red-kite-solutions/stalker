import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '../admin/config/config.service';
import { DatalayerModule } from '../datalayer.module';
import { CustomJobsController } from './custom-jobs.controller';
import { CustomJobsSchema } from './custom-jobs.model';
import { jobsInitProvider } from './custom-jobs.provider';
import { CustomJobsService } from './custom-jobs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'customJobs',
        schema: CustomJobsSchema,
      },
    ]),
    DatalayerModule,
  ],
  controllers: [CustomJobsController],
  providers: [CustomJobsService, ConfigService, ...jobsInitProvider],
  exports: [CustomJobsService, ...jobsInitProvider],
})
export class CustomJobsModule {}
