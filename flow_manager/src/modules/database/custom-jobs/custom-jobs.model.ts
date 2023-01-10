import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomJobsDocument = CustomJob & Document;

@Schema()
export class CustomJob {
  @Prop()
  public name!: string;

  @Prop()
  public code!: string;

  @Prop()
  public type!: string;

  @Prop()
  public language: string;
}

export const CustomJobsSchema = SchemaFactory.createForClass(CustomJob);
