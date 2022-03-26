import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = DomainNameResolvingJob & Document;

@Schema()
export class DomainNameResolvingJob {
  public task: string;
  public program!: string;
  public priority!: number;

  @Prop()
  public domain_name!: string;
}

export const DomainNameResolvingJobSchema = SchemaFactory.createForClass(
  DomainNameResolvingJob,
);
