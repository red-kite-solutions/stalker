import { MongooseModule } from '@nestjs/mongoose';
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

const discriminators = [
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
];

export const JobTypes = discriminators.map((d) => d.name);

export const JobModelModule = MongooseModule.forFeature([
  {
    name: 'job',
    schema: JobSchema,
    discriminators: discriminators,
  },
]);
