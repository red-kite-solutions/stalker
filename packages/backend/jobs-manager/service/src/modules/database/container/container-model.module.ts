import { MongooseModule } from '@nestjs/mongoose';
import { ContainerSchema as ContainersSchema } from './container.model';

export const ContainerModelModule = MongooseModule.forFeature([
  {
    name: 'containers',
    schema: ContainersSchema,
  },
]);
