import { getModelForClass, mongoose, prop } from '@typegoose/typegoose';
import { Job } from '../jobs/jobs.model';

export class JobSchedule extends mongoose.Document {
  @prop()
  public jobArray!: Job[];
}

export const jobScheduleModel = getModelForClass(JobSchedule);