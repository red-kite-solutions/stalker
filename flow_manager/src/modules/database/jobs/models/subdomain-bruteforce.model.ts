import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = SubdomainBruteforceJob & Document;

@Schema()
export class SubdomainBruteforceJob {
  public task: string;
  public companyId!: string;
  public priority!: number;

  @Prop()
  public domainName!: string;

  @Prop()
  public wordList: string;
}

export const SubdomainBruteforceJobSchema = SchemaFactory.createForClass(
  SubdomainBruteforceJob,
);
