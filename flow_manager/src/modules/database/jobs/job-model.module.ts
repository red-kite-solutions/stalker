import { MongooseModule } from '@nestjs/mongoose';
import { JobDefinition } from '../../../types/job-definition.type';
import { CustomJob, CustomJobSchema } from './models/custom-job.model';
import { JobSchema } from './models/jobs.model';

export const JobDefinitions: JobDefinition[] = [
  {
    name: CustomJob.name,
    schema: CustomJobSchema,
    create: CustomJob.create,
    params: CustomJob.parameterDefinitions,
  },
];

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
