import { MongooseModule } from '@nestjs/mongoose';
import { PortSchema } from './port.model';

export const PortModelModule = MongooseModule.forFeature([
  {
    name: 'port',
    schema: PortSchema,
  },
]);
