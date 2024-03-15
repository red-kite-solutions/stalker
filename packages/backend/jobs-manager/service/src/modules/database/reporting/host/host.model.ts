import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { DomainSummary } from '../domain/domain.summary';

export type HostDocument = Host & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
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
  public projectId: Types.ObjectId;

  @Prop()
  public projectName: string;

  @Prop()
  public domains?: DomainSummary[];

  @Prop()
  public tags?: Types.ObjectId[];

  @Prop()
  public notes?: string;

  @Prop()
  public updatedAt: number;

  @Prop()
  public createdAt: number;

  @Prop()
  public lastSeen: number;
}

export const HostSchema = SchemaFactory.createForClass(Host);
HostSchema.index({ ip: 1, projectId: 1 }, { unique: true });
