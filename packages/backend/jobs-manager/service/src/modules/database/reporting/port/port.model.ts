import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { HostSummary, HostSummaryType } from '../host/host.summary';

export type PortDocument = Port & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class Port {
  @Prop({ type: HostSummaryType })
  public host: HostSummary;

  @Prop()
  public projectId?: Types.ObjectId;

  /**
   * A pseudo-unique key identifying this entity. Used for findings.
   * This key should not change if this entity were to be recreated.
   */
  @Prop()
  public correlationKey!: string;

  @Prop()
  public port!: number;

  @Prop()
  public tags?: Types.ObjectId[];

  /**
   * Ports come from the OSI layer 4 protocols such as UDP and TCP
   * Only 'tcp' and 'udp' are supported values
   * https://en.wikipedia.org/wiki/OSI_model#Layer_4:_Transport_layer
   */
  @Prop({ enum: ['tcp', 'udp'] })
  public layer4Protocol!: string;

  @Prop()
  public updatedAt: number;

  @Prop()
  public createdAt: number;

  @Prop()
  public lastSeen: number;
}

export const PortSchema = SchemaFactory.createForClass(Port);

// The project id is not included here as the hostId-projectId combination is already unique
PortSchema.index(
  { 'host.id': 1, port: 1, layer4Protocol: 1 },
  { unique: true },
);
