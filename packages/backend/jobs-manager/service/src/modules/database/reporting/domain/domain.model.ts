import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { HostSummary } from '../host/host.summary';

export type DomainDocument = Domain & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class Domain {
  @Prop({ index: true })
  public name!: string;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @Prop()
  public correlationKey!: string;

  @Prop()
  public projectId!: Types.ObjectId;

  @Prop()
  public hosts?: HostSummary[];

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

  @Prop()
  blocked?: boolean;

  @Prop()
  blockedAt?: number;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);
DomainSchema.index({ name: 1, projectId: 1 }, { unique: true });
