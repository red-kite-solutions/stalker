import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = DomainNameResolvingJob & Document;

@Schema()
export class DomainNameResolvingJob {
  public task: string;
  public companyId!: string;
  public priority!: number;

  @Prop()
  public domainName!: string;
}

export const DomainNameResolvingJobSchema = SchemaFactory.createForClass(
  DomainNameResolvingJob,
);
