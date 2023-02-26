import { MongooseModule } from '@nestjs/mongoose';
import { JobDefinition } from '../../../types/job-definition.type';
import { CustomJob, CustomJobSchema } from './models/custom-job.model';
import {
  DomainNameResolvingJob,
  DomainNameResolvingJobSchema,
} from './models/domain-name-resolving.model';
import {
  HttpServerCheckJob,
  HttpServerCheckJobShema,
} from './models/http-server-check.model';
import { JobSchema } from './models/jobs.model';
import {
  TcpPortScanningJob,
  TcpPortScanningJobSchema,
} from './models/tcp-port-scanning.model';

export const JobDefinitions: JobDefinition[] = [
  {
    name: DomainNameResolvingJob.name,
    schema: DomainNameResolvingJobSchema,
    create: DomainNameResolvingJob.create,
    params: DomainNameResolvingJob.parameterDefinitions,
  },
  {
    name: TcpPortScanningJob.name,
    schema: TcpPortScanningJobSchema,
    create: TcpPortScanningJob.create,
    params: TcpPortScanningJob.parameterDefinitions,
  },
  {
    name: CustomJob.name,
    schema: CustomJobSchema,
    create: CustomJob.create,
    params: CustomJob.parameterDefinitions,
  },
  {
    name: HttpServerCheckJob.name,
    schema: HttpServerCheckJobShema,
    create: HttpServerCheckJob.create,
    params: HttpServerCheckJob.parameterDefinitions,
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

export const JobSourceBuiltIn = 'Stalker';
export const JobSourceUserCreated = 'Custom';
export const JobSources = [JobSourceBuiltIn, JobSourceUserCreated];
