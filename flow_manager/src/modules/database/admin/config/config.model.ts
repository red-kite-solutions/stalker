import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigDocument = Config & Document;

@Schema()
export class Config {
  @Prop()
  public IsNewContentReported: boolean;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
