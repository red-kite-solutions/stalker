import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { JobParameterDefinition } from '../../../types/job-parameter-definition.type';

export type CustomJobsDocument = CustomJobEntry & Document;

@Schema()
export class CustomJobEntry {
  @Prop({ unique: true, index: true })
  public name!: string;

  @Prop()
  public code!: string;

  @Prop()
  public type!: string;

  @Prop()
  public language: string;

  @Prop()
  public source: string;

  @Prop()
  public parameters: JobParameterDefinition[];
}

export const CustomJobsSchema = SchemaFactory.createForClass(CustomJobEntry);
