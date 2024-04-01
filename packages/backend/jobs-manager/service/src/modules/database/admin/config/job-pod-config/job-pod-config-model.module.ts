import { MongooseModule } from '@nestjs/mongoose';
import { JobPodConfigSchema } from './job-pod-config.model';

export const JobPodConfigModelModule = MongooseModule.forFeature([
  {
    name: 'jobPodConfig',
    schema: JobPodConfigSchema,
  },
]);
