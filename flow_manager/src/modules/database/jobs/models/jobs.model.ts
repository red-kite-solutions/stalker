import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DomainNameResolvingJob } from './domain-name-resolving.model';
import { SubdomainBruteforceJob } from './subdomain-bruteforce.model';
import { TcpPortScanningJob } from './tcp-port-scanning.model';

export type JobDocument = Job & Document;

@Schema({ discriminatorKey: 'task' })
export class Job {
  @Prop({
    type: String,
    required: true,
    enum: [
      DomainNameResolvingJob.name,
      SubdomainBruteforceJob.name,
      TcpPortScanningJob.name,
    ],
  })
  task: string;

  @Prop()
  public companyId!: string;

  @Prop()
  public priority!: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);
