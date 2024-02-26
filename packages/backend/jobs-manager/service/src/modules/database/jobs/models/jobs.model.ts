import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TimestampedString } from '../../../../types/timestamped-string.type';
import { CustomJob } from './custom-job.model';

export type JobDocument = Job & Document;

@Schema({ discriminatorKey: 'task' })
export class Job {
  @Prop({
    type: String,
    required: true,
    enum: [CustomJob.name],
  })
  task: string;

  @Prop()
  public projectId!: string;

  @Prop()
  public priority!: number;

  @Prop()
  public output: TimestampedString[];

  @Prop()
  public publishTime: number;

  @Prop()
  public startTime: number;

  @Prop()
  public endTime: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);
