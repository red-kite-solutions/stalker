import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobLogDocument = JobLog & Document;

export enum JobLogLevel {
  Debug,
  Info,
  Warning,
  Error,
}

@Schema()
export class JobLog {
  @Prop()
  public companyId!: string;

  @Prop()
  public jobId!: string;

  @Prop()
  public level!: JobLogLevel;

  @Prop()
  public data!: string;

  @Prop()
  public timestamp!: number;
}

export const JobLogsSchema = SchemaFactory.createForClass(JobLog);
