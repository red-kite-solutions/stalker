import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { JobParameter } from '../../subscriptions/subscriptions.model';

export type JobDocument = CustomJob & Document;

export const CustomJobTypes = ['code'];
export const CustomJobLanguages = ['python'];

@Schema()
export class CustomJob {
  public task: string;
  public companyId!: string;
  public priority!: number;

  @Prop()
  public name!: string;

  @Prop()
  public type!: string;

  @Prop()
  public code!: string;

  @Prop()
  public language!: string;

  @Prop()
  public customJobParameters!: JobParameter[];
}

export const CustomJobSchema = SchemaFactory.createForClass(CustomJob);
