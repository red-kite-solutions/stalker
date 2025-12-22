import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { DomainSummary } from '../domain/domain.summary';
import { HostSummary } from '../host/host.summary';

export type PortDocument = Port & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class Port {
  @ApiProperty()
  @Prop({ type: HostSummary })
  public host: HostSummary;

  @ApiProperty()
  @Prop()
  public projectId: Types.ObjectId;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @ApiProperty()
  @Prop()
  public correlationKey!: string;

  @ApiProperty({ example: 443 })
  @Prop()
  public port!: number;

  @ApiProperty({ isArray: true, type: Types.ObjectId })
  @Prop()
  public tags?: Types.ObjectId[];

  /**
   * Ports come from the OSI layer 4 protocols such as UDP and TCP
   * Only 'tcp' and 'udp' are supported values
   * https://en.wikipedia.org/wiki/OSI_model#Layer_4:_Transport_layer
   */
  @ApiProperty({ example: 'tcp' })
  @Prop({ enum: ['tcp', 'udp'] })
  public layer4Protocol!: string;

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

  @ApiProperty()
  @Prop()
  service: string;

  @ApiProperty()
  @Prop()
  product: string;

  @ApiProperty()
  @Prop()
  version: string;
}

export class ExtendedPort extends Port {
  @ApiProperty({ isArray: true, type: DomainSummary })
  domains?: DomainSummary[];
}

export const PortSchema = SchemaFactory.createForClass(Port);

// The project id is not included here as the hostId-projectId combination is already unique
PortSchema.index(
  { 'host.id': 1, port: 1, layer4Protocol: 1 },
  { unique: true },
);
