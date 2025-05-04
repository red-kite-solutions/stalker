import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema()
export class Group {
  @Prop({ unique: true })
  public name: string;

  @Prop({ index: true })
  // @Prop()
  public members: Types.ObjectId[];

  @Prop()
  public scopes: string[];

  @Prop({ default: false, type: Boolean })
  // @Prop()
  public readonly: boolean;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
