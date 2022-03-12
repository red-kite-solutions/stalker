import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HostDocument = Host & Document;

@Schema()
export class Host {
  @Prop()
  public ip!: string;

  public ports?: number[];
}

export const HostSchema = SchemaFactory.createForClass(Host);
