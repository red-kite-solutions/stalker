import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CronSubscriptionsDocument = CronSubscription & Document;

@Schema()
export class CronSubscription {
  @Prop()
  public name!: string;

  @Prop()
  public isEnabled!: boolean;

  @Prop()
  public cronExpression!: string;
}

export const CronSubscriptionsSchema =
  SchemaFactory.createForClass(CronSubscription);
