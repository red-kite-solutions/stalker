import { MongooseModule } from '@nestjs/mongoose';
import { DomainSchema } from './domain.model';

export const DomainModelModule = MongooseModule.forFeature([
  {
    name: 'domain',
    schema: DomainSchema,
  },
]);
