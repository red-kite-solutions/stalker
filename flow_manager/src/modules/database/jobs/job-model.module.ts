import { MongooseModule } from '@nestjs/mongoose';
import { JobsService } from './jobs.service';
import {
  DomainNameResolvingJob,
  DomainNameResolvingJobSchema,
} from './models/domain-name-resolving.model';
import { JobSchema } from './models/jobs.model';
import {
  TcpPortScanningJob,
  TcpPortScanningJobSchema,
} from './models/tcp-port-scanning.model';

export const JobDefinitions = [
  {
    name: DomainNameResolvingJob.name,
    schema: DomainNameResolvingJobSchema,
    pointer: JobsService.createDomainResolvingJob_,
  },
  {
    name: TcpPortScanningJob.name,
    schema: TcpPortScanningJobSchema,
    pointer: JobsService.createTcpPortScanJob_,
  },
];

export const JobTypes = JobDefinitions.map((j) => j.name);

const discriminators = JobDefinitions.map((j) => {
  return { name: j.name, schema: j.schema };
});

export const JobModelModule = MongooseModule.forFeature([
  {
    name: 'job',
    schema: JobSchema,
    discriminators: discriminators,
  },
]);
