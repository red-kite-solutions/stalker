import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigDocument = Config & Document;

@Schema({ capped: { max: 1 } })
export class Config {}

export const ConfigSchema = SchemaFactory.createForClass(Config);
