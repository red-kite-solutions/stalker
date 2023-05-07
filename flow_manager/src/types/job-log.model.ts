import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { JobLogLevel } from './timestamped-string.type';

export type JobLogDocument = JobLog & Document;

@Schema()
export class JobLog {
  @Prop()
  public companyId!: string;

  @Prop()
  public jobId!: string;

  @Prop()
  public level!: JobLogLevel;

  @Prop()
  public value!: string;

  @Prop()
  public timestamp!: number;
}

export const JobLogsSchema = SchemaFactory.createForClass(JobLog);
