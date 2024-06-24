import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TimestampedString } from '../../../../types/timestamped-string.type';
import { MONGO_TIMESTAMP_FUNCTION } from '../../database.constants';
import { CustomJob } from './custom-job.model';

export type JobDocument = Job & Document;

@Schema({
  discriminatorKey: 'task',
  timestamps: { currentTime: MONGO_TIMESTAMP_FUNCTION, createdAt: true },
  capped: { max: 300000 },
})
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

  @Prop()
  public createdAt: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);
