import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty()
  @Prop({ index: true })
  public projectId!: string;

  @ApiProperty()
  @Prop()
  public priority!: number;

  @ApiProperty()
  @Prop()
  public output: TimestampedString[];

  @ApiProperty()
  @Prop()
  public publishTime: number;

  @ApiProperty()
  @Prop({ index: -1 })
  public startTime: number;

  @ApiProperty()
  @Prop()
  public endTime: number;

  @ApiProperty()
  @Prop()
  public createdAt: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);
