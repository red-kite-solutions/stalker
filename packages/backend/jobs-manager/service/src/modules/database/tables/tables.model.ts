import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiScope } from '../../auth/scopes.constants';
import { ResourceType } from '../reporting/resource.type';

export type TableDocument = Table & Document;

export class TableField {
  @Prop()
  name: string;

  @Prop()
  findingKey: string;

  @Prop()
  findingFieldKey: string;
}

@Schema()
export class Table {
  @Prop({ index: true, unique: true })
  name: string;

  @Prop()
  isPinned?: boolean;

  @Prop()
  icon?: string;

  @Prop()
  resource: ResourceType;

  @Prop()
  fields: TableField[];

  @Prop()
  requiredScopes?: ApiScope[];
}

export const TableSchema = SchemaFactory.createForClass(Table);
