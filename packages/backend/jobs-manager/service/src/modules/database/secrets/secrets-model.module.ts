import { MongooseModule } from '@nestjs/mongoose';
import { SecretSchema } from './secrets.model';

export const SecretsModelModule = MongooseModule.forFeature([
  {
    name: 'secret',
    schema: SecretSchema,
  },
]);
