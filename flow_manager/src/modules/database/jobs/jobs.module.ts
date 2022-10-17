import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobQueueModule } from 'src/modules/job-queue/job-queue.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import {
  DomainNameResolvingJob,
  DomainNameResolvingJobSchema,
} from './models/domain-name-resolving.model';
import { JobSchema } from './models/jobs.model';
import {
  SubdomainBruteforceJob,
  SubdomainBruteforceJobSchema,
} from './models/subdomain-bruteforce.model';

@Module({
  imports: [
    JobQueueModule,
    MongooseModule.forFeature([
      {
        name: 'job',
        schema: JobSchema,
        discriminators: [
          {
            name: DomainNameResolvingJob.name,
            schema: DomainNameResolvingJobSchema,
          },
          {
            name: SubdomainBruteforceJob.name,
            schema: SubdomainBruteforceJobSchema,
          },
        ],
      },
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
