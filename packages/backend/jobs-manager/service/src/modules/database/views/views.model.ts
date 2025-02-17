import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ResourceType } from '../reporting/resource.type';

export type ViewDocument = View & Document;

export class ViewField {
  @Prop()
  name: string;

  @Prop()
  findingKey: string;

  @Prop()
  findingFieldKey: string;
}

@Schema()
export class View {
  @Prop({ index: true, unique: true })
  name: string;

  @Prop()
  isPinned?: boolean;

  @Prop()
  icon?: string;

  @Prop()
  resource: ResourceType;

  @Prop()
  fields: ViewField[];
}

export const ViewSchema = SchemaFactory.createForClass(View);
