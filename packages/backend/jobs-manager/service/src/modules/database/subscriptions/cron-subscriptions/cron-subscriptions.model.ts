import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DataSource } from '../../data-source/data-source.model';
import {
  AndJobCondition,
  JobCondition,
  JobParameter,
  OrJobCondition,
} from '../subscriptions.type';

export type CronSubscriptionsDocument = CronSubscription & Document;

export const inputSources = [
  'ALL_DOMAINS',
  'ALL_HOSTS',
  'ALL_TCP_PORTS',
  'ALL_IP_RANGES',
  'ALL_WEBSITES',
] as const;

export type InputSource = (typeof inputSources)[number];

export class CronSubscriptionBatching {
  @Prop()
  enabled: boolean;

  @Prop()
  size?: number;
}

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
  public batch?: CronSubscriptionBatching;

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

  @Prop()
  public source?: DataSource;

  @Prop()
  public cooldown?: number;
}

export const CronSubscriptionsSchema =
  SchemaFactory.createForClass(CronSubscription);
