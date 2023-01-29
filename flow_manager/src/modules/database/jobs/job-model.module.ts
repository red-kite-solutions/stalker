import { MongooseModule } from '@nestjs/mongoose';
import { JobDefinition } from '../../../types/job-definition.type';
import { CustomJob, CustomJobSchema } from './models/custom-job.model';
import {
  DomainNameResolvingJob,
  DomainNameResolvingJobSchema,
} from './models/domain-name-resolving.model';
import {
  HttpOrHttpsServerCheckJob,
  HttpOrHttpsServerCheckJobShema,
} from './models/http-or-https-server-check.model';
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
  },
  {
    name: TcpPortScanningJob.name,
    schema: TcpPortScanningJobSchema,
    create: TcpPortScanningJob.create,
  },
  {
    name: CustomJob.name,
    schema: CustomJobSchema,
    create: CustomJob.create,
  },
  {
    name: HttpOrHttpsServerCheckJob.name,
    schema: HttpOrHttpsServerCheckJobShema,
    pointer: JobsService.createHttpOrHttpsServerCheckJob_,
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
