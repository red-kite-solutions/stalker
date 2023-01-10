import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomJobsController } from './custom-jobs.controller';
import { CustomJobsSchema } from './custom-jobs.model';
import { CustomJobsService } from './custom-jobs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'customJobs',
        schema: CustomJobsSchema,
      },
    ]),
  ],
  controllers: [CustomJobsController],
  providers: [CustomJobsService],
  exports: [CustomJobsService],
})
export class CustomJobsModule {}
