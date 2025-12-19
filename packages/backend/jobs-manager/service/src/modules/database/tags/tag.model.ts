import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type TagsDocument = Tag & Document;

@Schema()
export class Tag {
  @ApiProperty()
  @Prop({ unique: true })
  public text!: string;

  @ApiProperty()
  @Prop()
  public color!: string;
}

export const TagsSchema = SchemaFactory.createForClass(Tag);
