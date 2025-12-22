import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type JobContainerDocument = JobContainer & Document;

export class JobContainerSummary {
  id: Types.ObjectId;
  image: string;
}

@Schema()
export class JobContainer {
  @ApiProperty()
  @Prop({ unique: true })
  public image!: string;
}

export const JobContainerSchema = SchemaFactory.createForClass(JobContainer);
