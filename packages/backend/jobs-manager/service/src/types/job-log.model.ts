import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { JobLogLevel } from './timestamped-string.type';

export type JobLogDocument = JobLog & Document;

@Schema()
export class JobLog {
  @ApiProperty()
  @Prop()
  public projectId!: string;

  @ApiProperty()
  @Prop()
  public jobId!: string;

  @ApiProperty()
  @Prop()
  public level!: JobLogLevel;

  @ApiProperty()
  @Prop()
  public value!: string;

  @ApiProperty()
  @Prop()
  public timestamp!: number;
}

export const JobLogsSchema = SchemaFactory.createForClass(JobLog);
