import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { HostSummary } from '../host/host.summary';

export type IpRangeDocument = IpRange & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class IpRange {
  @ApiProperty({ example: '1.1.1.0' })
  @Prop({ index: true })
  public ip!: string;

  @ApiProperty({ example: 24 })
  @Prop()
  public mask!: number;

  @ApiProperty()
  @Prop()
  public projectId!: Types.ObjectId;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @ApiProperty()
  @Prop()
  public correlationKey!: string;

  @ApiProperty({ example: 16843008 })
  @Prop({ index: true })
  ipMinInt!: number;

  @ApiProperty({ example: 16843263 })
  @Prop({ index: true })
  ipMaxInt!: number;

  @ApiProperty({ isArray: true, type: Types.ObjectId })
  @Prop()
  public tags?: Types.ObjectId[];

  @ApiProperty()
  @Prop()
  public updatedAt: number;

  @ApiProperty()
  @Prop()
  public createdAt: number;

  @ApiProperty()
  @Prop()
  public lastSeen: number;

  @ApiProperty()
  @Prop()
  blocked?: boolean;

  @ApiProperty()
  @Prop()
  blockedAt?: number;
}

export class ExtendedIpRange extends IpRange {
  _id?: Types.ObjectId;
  hosts?: HostSummary[];
}

export const IpRangeSchema = SchemaFactory.createForClass(IpRange);
IpRangeSchema.index({ ip: 1, projectId: 1, mask: 1 }, { unique: true });
