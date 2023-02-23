import { MongooseModule } from '@nestjs/mongoose';
import { JobLogsSchema } from './models/job-log.model';

export const JobLogsModelModule = MongooseModule.forFeature([
  {
    name: 'jobLogs',
    schema: JobLogsSchema,
  },
]);
