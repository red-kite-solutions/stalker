import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DataSource } from '../../data-source/data-source.model';
import {
  AndJobCondition,
  JobCondition,
  JobParameter,
  OrJobCondition,
} from '../subscriptions.type';

export type EventSubscriptionsDocument = EventSubscription & Document;

@Schema()
export class EventSubscription {
  @Prop()
  public name!: string;

  @Prop()
  public isEnabled!: boolean;

  @Prop()
  public projectId?: Types.ObjectId;

  @Prop()
  public findings!: string[];

  @Prop()
  public jobName!: string;

  @Prop()
  public jobParameters: JobParameter[];

  @Prop()
  public conditions: Array<AndJobCondition | OrJobCondition | JobCondition>;

  @Prop()
  public cooldown: number;

  // true for a built-in subscription, false otherwise
  @Prop()
  public builtIn?: boolean;

  @Prop()
  public file?: string;

  @Prop()
  public discriminator?: string;

  @Prop()
  public source?: DataSource;
}

export const EventSubscriptionsSchema =
  SchemaFactory.createForClass(EventSubscription);
