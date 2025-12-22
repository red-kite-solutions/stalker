import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema()
export class Group {
  @ApiProperty()
  @Prop({ unique: true })
  public name: string;

  @ApiProperty()
  @Prop()
  public description: string;

  @ApiProperty({ isArray: true, type: Types.ObjectId })
  @Prop({ index: true })
  public members: Types.ObjectId[];

  @ApiProperty()
  @Prop()
  public scopes: string[];

  @ApiProperty()
  @Prop({ default: false, type: Boolean })
  public readonly: boolean;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
