import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueModule } from '../../job-queue/queue.module';
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
import {
  TcpPortScanningJob,
  TcpPortScanningJobSchema,
} from './models/tcp-port-scanning.model';

@Module({
  imports: [
    QueueModule,
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
          {
            name: TcpPortScanningJob.name,
            schema: TcpPortScanningJobSchema,
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
