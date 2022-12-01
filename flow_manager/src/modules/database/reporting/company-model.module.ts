import { MongooseModule } from '@nestjs/mongoose';
import { CompanySchema } from './company.model';

export const CompanyModelModule = MongooseModule.forFeature([
  {
    name: 'company',
    schema: CompanySchema,
  },
]);
