import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema } from './report.model';

export const ReportModelModule = MongooseModule.forFeature([
  {
    name: 'report',
    schema: ReportSchema,
  },
]);
