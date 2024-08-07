import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigDocument = Config & Document;

@Schema({ capped: { max: 1 } })
export class Config {
  @Prop()
  jobRunRetentionTimeSeconds: number;

  @Prop()
  findingRetentionTimeSeconds: number;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
