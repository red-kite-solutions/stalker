import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema()
export class Group {
  @Prop({ unique: true })
  public name: string;

  @Prop()
  public description: string;

  @Prop({ index: true })
  public members: Types.ObjectId[];

  @Prop()
  public scopes: string[];

  @Prop({ default: false, type: Boolean })
  public readonly: boolean;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
