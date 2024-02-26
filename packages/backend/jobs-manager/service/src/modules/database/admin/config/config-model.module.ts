import { MongooseModule } from '@nestjs/mongoose';
import { ConfigSchema } from './config.model';

export const ConfigModelModule = MongooseModule.forFeature([
  {
    name: 'config',
    schema: ConfigSchema,
  },
]);
