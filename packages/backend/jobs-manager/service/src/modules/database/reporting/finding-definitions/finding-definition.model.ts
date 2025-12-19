import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { FindingType } from '../findings/finding.model';

export type FindingDefinitionDocument = FindingDefinition & Document;

export class FindingFieldDefinition {
  @ApiProperty()
  @Prop({ index: true })
  key: string;

  @ApiProperty()
  @Prop()
  label?: string;

  @ApiProperty()
  @Prop()
  public type: FindingType;
}

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class FindingDefinition {
  @ApiProperty()
  @Prop({ index: true, unique: true })
  key: string;

  @ApiProperty({ isArray: true, type: FindingFieldDefinition })
  @Prop()
  fields: FindingFieldDefinition[];

  @ApiProperty()
  @Prop()
  public updatedAt: number;

  @ApiProperty()
  @Prop()
  public createdAt: number;
}

export const FindingDefinitionSchema =
  SchemaFactory.createForClass(FindingDefinition);
FindingDefinitionSchema.index({ 'fields.key': 1 });
