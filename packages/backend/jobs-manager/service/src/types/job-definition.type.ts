import { Schema } from 'mongoose';
import { Job } from '../modules/database/jobs/models/jobs.model';
import { JobParameter } from '../modules/database/subscriptions/event-subscriptions/event-subscriptions.model';
import { JobParameterDefinition } from './job-parameter-definition.type';

export interface JobDefinition {
  name: string;
  schema: Schema;
  create: (jobParameters: JobParameter[]) => Job;
  params: JobParameterDefinition[];
}
