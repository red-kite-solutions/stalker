import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PortDocument = Port & Document;

@Schema()
export class Port {
  @Prop({ index: true })
  public hostId?: Types.ObjectId;

  @Prop()
  public companyId?: Types.ObjectId;

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
}

export const PortSchema = SchemaFactory.createForClass(Port);
PortSchema.index({ hostId: 1 }, {});
