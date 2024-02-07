import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ index: true, unique: true })
  public name: string;

  @Prop()
  public ipRanges?: string[];

  @Prop()
  public logo: string;

  @Prop()
  public notes: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
