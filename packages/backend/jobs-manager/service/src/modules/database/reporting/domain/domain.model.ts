import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { HostSummary } from '../host/host.summary';

export type DomainDocument = Domain & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class Domain {
  @ApiProperty({ example: 'example.com' })
  @Prop({ index: true })
  public name!: string;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @ApiProperty()
  @Prop()
  public correlationKey!: string;

  @ApiProperty()
  @Prop()
  public projectId!: Types.ObjectId;

  @ApiProperty({ isArray: true, type: HostSummary })
  @Prop()
  public hosts?: HostSummary[];

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

export const DomainSchema = SchemaFactory.createForClass(Domain);
DomainSchema.index({ name: 1, projectId: 1 }, { unique: true });
