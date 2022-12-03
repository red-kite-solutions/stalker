import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionsDocument = Subscription & Document;

@Schema()
export class Subscription {
  @Prop({ unique: true })
  public text!: string;

  @Prop()
  public color!: string;
}

export const SubscriptionsSchema = SchemaFactory.createForClass(Subscription);
