import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';

export type IpRangeDocument = IpRange & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class IpRange {
  @Prop({ index: true })
  public ip!: string;

  @Prop()
  public mask!: number;

  @Prop()
  public projectId!: Types.ObjectId;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @Prop()
  public correlationKey!: string;

  @Prop({ index: true })
  ipMinInt!: number;

  @Prop({ index: true })
  ipMaxInt!: number;

  @Prop()
  public tags?: Types.ObjectId[];

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

export const IpRangeSchema = SchemaFactory.createForClass(IpRange);
IpRangeSchema.index({ ip: 1, projectId: 1, mask: 1 }, { unique: true });
