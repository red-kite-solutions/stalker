import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CronSubscriptionsDocument = CronSubscription & Document;

export class JobParameter {
  public name!: string;
  public value!: unknown;
}

@Schema()
export class CronSubscription {
  @Prop()
  public name!: string;

  @Prop()
  public companyId?: Types.ObjectId;

  @Prop()
  public cronExpression!: string;

  @Prop()
  public jobName!: string;

  @Prop()
  public jobParameters: JobParameter[];

  // true for a built-in subsctiption, false otherwise
  @Prop()
  public builtIn?: boolean;

  @Prop()
  public file?: string;
}

export const CronSubscriptionsSchema =
  SchemaFactory.createForClass(CronSubscription);
