import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './project.model';

export const ProjectModelModule = MongooseModule.forFeature([
  {
    name: 'project',
    schema: ProjectSchema,
  },
]);
