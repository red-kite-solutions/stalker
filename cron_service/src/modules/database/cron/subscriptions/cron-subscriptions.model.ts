import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CronSubscriptionsDocument = CronSubscription & Document;

@Schema()
export class CronSubscription {
  public name!: string;

  public lastRun!: number;

  public cronExpression!: string;
}

export const CronSubscriptionsSchema =
  SchemaFactory.createForClass(CronSubscription);
