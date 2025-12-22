import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { DomainSummary } from '../domain/domain.summary';

export type HostDocument = Host & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class Host {
  @ApiProperty({ example: '1.1.1.1' })
  @Prop({ index: true })
  public ip!: string;

  @ApiProperty({ example: 16843009 })
  @Prop({ index: true })
  public ipInt!: number;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @ApiProperty()
  @Prop()
  public correlationKey!: string;

  @ApiProperty()
  @Prop()
  public projectId: Types.ObjectId;

  @ApiProperty({ isArray: true, type: DomainSummary })
  @Prop()
  public domains?: DomainSummary[];

  @ApiProperty({ isArray: true, type: Types.ObjectId })
  @Prop()
  public tags?: Types.ObjectId[];

  @ApiProperty()
  @Prop()
  public notes?: string;

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

export const HostSchema = SchemaFactory.createForClass(Host);
HostSchema.index({ ip: 1, projectId: 1 }, { unique: true });
