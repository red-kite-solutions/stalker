import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type SubscriptionTriggerDocument = SubscriptionTrigger & Document;

@Schema()
export class SubscriptionTrigger {
  @ApiProperty()
  @Prop()
  public subscriptionId!: Types.ObjectId;

  @ApiProperty()
  @Prop()
  public correlationKey!: string;

  @ApiProperty()
  @Prop()
  public lastTrigger!: number;

  @ApiProperty()
  @Prop()
  public discriminator: string | null;
}

export const SubscriptionTriggerSchema =
  SchemaFactory.createForClass(SubscriptionTrigger);
SubscriptionTriggerSchema.index(
  { subscriptionId: 1, correlationKey: 1, discriminator: 1 },
  { unique: true },
);
