import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeySchema } from './api-key.model';

export const ApiKeyModelModule = MongooseModule.forFeature([
  {
    name: 'apikey',
    schema: ApiKeySchema,
  },
]);
