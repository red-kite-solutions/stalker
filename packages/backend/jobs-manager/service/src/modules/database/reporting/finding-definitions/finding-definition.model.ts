import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../../database.constants';
import { FindingType } from '../findings/finding.model';

export type FindingDefinitionDocument = FindingDefinition & Document;

export class FindingFieldDefinition {
  @Prop({ index: true })
  key: string;

  @Prop()
  label?: string;

  @Prop()
  public type: FindingType;
}

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class FindingDefinition {
  @Prop({ index: true, unique: true })
  key: string;

  @Prop()
  fields: FindingFieldDefinition[];

  @Prop()
  public updatedAt: number;

  @Prop()
  public createdAt: number;
}

export const FindingDefinitionSchema =
  SchemaFactory.createForClass(FindingDefinition);
FindingDefinitionSchema.index({ 'fields.key': 1 });
