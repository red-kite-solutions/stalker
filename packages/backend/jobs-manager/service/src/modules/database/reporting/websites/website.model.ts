import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { DomainSummary, DomainSummaryType } from '../domain/domain.summary';
import { HostSummary, HostSummaryType } from '../host/host.summary';
import { PortSummary, PortSummaryType } from '../port/port.summary';

export type WebsiteDocument = Website & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class Website {
  @Prop({ type: HostSummaryType })
  public host: HostSummary;

  @Prop({ type: Array<HostSummaryType> })
  public alternativeHosts?: HostSummary[];

  @Prop({ type: DomainSummaryType })
  public domain?: DomainSummary;

  @Prop({ type: Array<DomainSummaryType> })
  public alternativeDomains?: DomainSummary[];

  @Prop({ type: PortSummaryType })
  public port: PortSummary;

  @Prop({ type: Array<PortSummaryType> })
  public alternativePorts?: PortSummary[];

  @Prop()
  public path: string;

  @Prop()
  public ssl?: boolean;

  @Prop()
  public sitemap: string[];

  @Prop()
  public projectId?: Types.ObjectId;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @Prop()
  public correlationKey!: string;

  @Prop()
  public tags?: Types.ObjectId[];

  @Prop()
  public updatedAt: number;

  @Prop()
  public createdAt: number;

  @Prop()
  public lastSeen: number;

  @Prop()
  public blocked?: boolean;

  @Prop()
  public blockedAt?: number;

  @Prop()
  public mergedInId?: Types.ObjectId;
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);

// The project id and host id are not included here as the port id - host id - projectId combination is already unique
WebsiteSchema.index(
  { 'port.id': 1, 'domain.id': 1, path: 1 },
  { unique: true },
);
