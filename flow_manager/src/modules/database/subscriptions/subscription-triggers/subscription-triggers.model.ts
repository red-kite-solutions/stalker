import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionTriggerDocument = SubscriptionTrigger & Document;

@Schema()
export class SubscriptionTrigger {
  @Prop()
  public subscriptionId!: Types.ObjectId;

  @Prop()
  public correlationKey!: string;

  @Prop()
  public lastTrigger!: number;
}

export const SubscriptionTriggerSchema =
  SchemaFactory.createForClass(SubscriptionTrigger);
SubscriptionTriggerSchema.index(
  { subscriptionId: 1, correlationKey: 1 },
  { unique: true },
);
