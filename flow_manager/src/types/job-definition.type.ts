import { Schema } from 'mongoose';
import { Job } from '../modules/database/jobs/models/jobs.model';
import { JobParameter } from '../modules/database/subscriptions/subscriptions.model';

export interface JobDefinition {
  name: string;
  schema: Schema;
  create: (jobParameters: JobParameter[]) => Job;
}
