import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { API_SCOPES, ApiScope } from '../../auth/scopes.constants';
import { ResourceType, resourceTypes } from '../reporting/resource.type';

export type TableDocument = Table & Document;

export class TableField {
  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  findingKey: string;

  @ApiProperty()
  @Prop()
  findingFieldKey: string;
}

@Schema()
export class Table {
  @ApiProperty()
  @Prop({ index: true, unique: true })
  name: string;

  @ApiProperty()
  @Prop()
  isPinned?: boolean;

  @ApiProperty()
  @Prop()
  icon?: string;

  @ApiProperty({ enum: resourceTypes })
  @Prop()
  resource: ResourceType;

  @ApiProperty({ isArray: true, type: TableField })
  @Prop()
  fields: TableField[];

  @ApiProperty({
    isArray: true,
    enum: API_SCOPES,
    example: ['resources:domains:read'],
  })
  @Prop()
  requiredScopes?: ApiScope[];
}

export const TableSchema = SchemaFactory.createForClass(Table);
