import { MongooseModule } from '@nestjs/mongoose';
import { JobContainerSchema } from './job-container.model';

export const JobContainerModelModule = MongooseModule.forFeature([
  {
    name: 'jobContainers',
    schema: JobContainerSchema,
  },
]);
