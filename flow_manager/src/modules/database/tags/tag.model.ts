import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TagsDocument = Tag & Document;

@Schema()
export class Tag {
  @Prop({ unique: true })
  public text!: string;

  @Prop()
  public color!: string;
}

export const TagsSchema = SchemaFactory.createForClass(Tag);
