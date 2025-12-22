import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { DomainSummary } from '../domain/domain.summary';
import { HostSummary } from '../host/host.summary';
import { PortSummary } from '../port/port.summary';

export type WebsiteDocument = Website & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class Website {
  @ApiProperty()
  @Prop({ type: HostSummary })
  public host: HostSummary;

  @ApiProperty()
  @Prop({ type: DomainSummary })
  public domain?: DomainSummary;

  @ApiProperty()
  @Prop({ type: PortSummary })
  public port: PortSummary;

  @ApiProperty()
  @Prop()
  public path: string;

  @ApiProperty()
  @Prop()
  public ssl?: boolean;

  @ApiProperty()
  @Prop()
  public sitemap: string[];

  @ApiProperty()
  @Prop()
  public projectId?: Types.ObjectId;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @ApiProperty()
  @Prop()
  public correlationKey!: string;

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
  public blocked?: boolean;

  @ApiProperty()
  @Prop()
  public blockedAt?: number;

  @ApiProperty()
  @Prop({ index: true })
  public mergedInId?: Types.ObjectId;
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);

// The project id and host id are not included here as the port id - host id - projectId combination is already unique
WebsiteSchema.index(
  { 'port.id': 1, 'domain.id': 1, path: 1 },
  { unique: true },
);
