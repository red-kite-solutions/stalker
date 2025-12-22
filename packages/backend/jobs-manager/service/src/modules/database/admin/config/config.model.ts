import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type ConfigDocument = Config & Document;

@Schema({ capped: { max: 1 } })
export class Config {
  @ApiProperty()
  @Prop()
  jobRunRetentionTimeSeconds: number;

  @ApiProperty()
  @Prop()
  findingRetentionTimeSeconds: number;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
