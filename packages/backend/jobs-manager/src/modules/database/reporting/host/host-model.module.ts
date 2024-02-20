import { MongooseModule } from '@nestjs/mongoose';
import { HostSchema } from './host.model';

export const HostModelModule = MongooseModule.forFeature([
  {
    name: 'host',
    schema: HostSchema,
  },
]);
