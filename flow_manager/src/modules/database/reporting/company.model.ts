import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema()
export class Company {
  @Prop({ index: true, unique: true })
  public name: string;

  // Simplified for now, eventually a RefreshFrequency object
  // detailing the refresh options
  @Prop()
  public dataRefreshFrequency: number;

  @Prop()
  public ipRanges?: string[];

  @Prop()
  public logo: string;

  @Prop()
  public notes: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
