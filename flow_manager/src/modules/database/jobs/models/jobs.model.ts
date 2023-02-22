import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TimestampedString } from '../../../../types/timestamped-string.type';
import { CustomJob } from './custom-job.model';
import { DomainNameResolvingJob } from './domain-name-resolving.model';
import { HttpServerCheckJob } from './http-server-check.model';
import { TcpPortScanningJob } from './tcp-port-scanning.model';

export type JobDocument = Job & Document;

@Schema({ discriminatorKey: 'task' })
export class Job {
  @Prop({
    type: String,
    required: true,
    enum: [
      DomainNameResolvingJob.name,
      TcpPortScanningJob.name,
      HttpServerCheckJob.name,
      CustomJob.name,
    ],
  })
  task: string;

  @Prop()
  public companyId!: string;

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
