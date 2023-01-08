import { MongooseModule } from '@nestjs/mongoose';
import { FindingSchema } from './finding.model';

export const FindingModelModule = MongooseModule.forFeature([
  {
    name: 'finding',
    schema: FindingSchema,
  },
]);
