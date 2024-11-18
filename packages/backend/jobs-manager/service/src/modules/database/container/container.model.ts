import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContainerDocument = Container & Document;

export class ContainerSummary {
  id: Types.ObjectId;
  image: string;
}

@Schema()
export class Container {
  @Prop({ unique: true })
  public image!: string;
}

export const ContainerSchema = SchemaFactory.createForClass(Container);
