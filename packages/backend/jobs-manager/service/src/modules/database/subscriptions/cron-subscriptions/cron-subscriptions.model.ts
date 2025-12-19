import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty()
  @Prop()
  enabled: boolean;

  @ApiProperty()
  @Prop()
  size?: number;
}

@Schema()
export class CronSubscription {
  @ApiProperty()
  @Prop()
  public name!: string;

  @ApiProperty()
  @Prop()
  public isEnabled!: boolean;

  @ApiProperty()
  @Prop()
  public projectId?: Types.ObjectId;

  @ApiProperty()
  @Prop()
  public input?: InputSource;

  @ApiProperty()
  @Prop()
  public batch?: CronSubscriptionBatching;

  @ApiProperty()
  @Prop()
  public cronExpression!: string;

  @ApiProperty()
  @Prop()
  public jobName!: string;

  @ApiProperty()
  @Prop()
  public jobParameters: JobParameter[];

  @ApiProperty()
  @Prop()
  public conditions: Array<JobCondition | OrJobCondition | AndJobCondition>;

  // true for a built-in subsctiption, false otherwise
  @ApiProperty()
  @Prop()
  public builtIn?: boolean;

  @ApiProperty()
  @Prop()
  public file?: string;

  @ApiProperty()
  @Prop()
  public source?: DataSource;

  @ApiProperty()
  @Prop()
  public cooldown?: number;
}

export const CronSubscriptionsSchema =
  SchemaFactory.createForClass(CronSubscription);
