import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DomainSummary } from '../domain/domain.summary';

export type HostDocument = Host & Document;

@Schema()
export class Host {
  @Prop({ unique: true, index: true })
  public ip!: string;

  @Prop()
  public companyId: Types.ObjectId;

  @Prop()
  public domains?: DomainSummary[];

  @Prop()
  public tags?: Types.ObjectId[];

  @Prop()
  public notes?: string;

  // Simplified for now, but it will eventually be a full class
  @Prop()
  public ports?: number[];
}

export const HostSchema = SchemaFactory.createForClass(Host);
