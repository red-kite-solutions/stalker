import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema()
export class Group {
  @Prop({ unique: true })
  public name: string;

  @Prop()
  public members: Types.ObjectId[];

  @Prop()
  public scopes: string[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
