import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  AndJobCondition,
  JobCondition,
  OrJobCondition,
} from '../event-subscriptions/event-subscriptions.model';

export type CronSubscriptionsDocument = CronSubscription & Document;

export class JobParameter {
  public name!: string;
  public value!: unknown;
}

export const inputSources = [
  'ALL_DOMAINS',
  'ALL_HOSTS',
  'ALL_TCP_PORTS',
  'ALL_IP_RANGES',
] as const;

export type InputSource = (typeof inputSources)[number];

@Schema()
export class CronSubscription {
  @Prop()
  public name!: string;

  @Prop()
  public isEnabled!: boolean;

  @Prop()
  public projectId?: Types.ObjectId;

  @Prop()
  public input?: InputSource;

  @Prop()
  public cronExpression!: string;

  @Prop()
  public jobName!: string;

  @Prop()
  public jobParameters: JobParameter[];

  @Prop()
  public conditions: Array<JobCondition | OrJobCondition | AndJobCondition>;

  // true for a built-in subsctiption, false otherwise
  @Prop()
  public builtIn?: boolean;

  @Prop()
  public file?: string;
}

export const CronSubscriptionsSchema =
  SchemaFactory.createForClass(CronSubscription);
