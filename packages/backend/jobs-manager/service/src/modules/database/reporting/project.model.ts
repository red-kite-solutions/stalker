import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @ApiProperty()
  @Prop({ index: true, unique: true })
  public name: string;

  @ApiProperty()
  @Prop()
  public logo: string;

  @ApiProperty()
  @Prop()
  public notes: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
