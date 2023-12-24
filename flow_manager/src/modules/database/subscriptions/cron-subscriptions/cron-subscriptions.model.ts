import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { JobCondition } from '../event-subscriptions/event-subscriptions.model';

export type CronSubscriptionsDocument = CronSubscription & Document;

export class JobParameter {
  public name!: string;
  public value!: unknown;
}

export type InputSource = 'ALL_DOMAINS' | 'ALL_HOSTS' | 'ALL_TCP_PORTS';

@Schema()
export class CronSubscription {
  @Prop()
  public name!: string;

  @Prop()
  public companyId?: Types.ObjectId;

  @Prop()
  public input?: InputSource;

  @Prop()
  public cronExpression!: string;

  @Prop()
  public jobName!: string;

  @Prop()
  public jobParameters: JobParameter[];

  @Prop()
  public conditions: JobCondition[];

  // true for a built-in subsctiption, false otherwise
  @Prop()
  public builtIn: boolean;

  @Prop()
  public file?: string;
}

export const CronSubscriptionsSchema =
  SchemaFactory.createForClass(CronSubscription);
