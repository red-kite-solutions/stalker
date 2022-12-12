import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DomainSummary } from '../domain/domain.summary';

export type HostDocument = Host & Document;

export class Port {
  public id!: string;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @Prop()
  public correlationKey!: string;

  @Prop()
  public port: number;
}
export const PortSchema = SchemaFactory.createForClass(Port);

@Schema()
export class Host {
  @Prop({ index: true })
  public ip!: string;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @Prop()
  public correlationKey!: string;

  @Prop()
  public companyId: Types.ObjectId;

  @Prop()
  public companyName: string;

  @Prop()
  public domains?: DomainSummary[];

  @Prop()
  public tags?: Types.ObjectId[];

  @Prop()
  public notes?: string;

  // Simplified for now, but it will eventually be a full class
  @Prop()
  public ports?: Port[];
}

export const HostSchema = SchemaFactory.createForClass(Host);
HostSchema.index({ ip: 1, companyId: 1 }, { unique: true });
