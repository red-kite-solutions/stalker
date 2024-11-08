import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventSubscriptionsDocument = EventSubscription & Document;

export class JobParameter {
  public name!: string;
  public value!: unknown;
}

export class JobCondition {
  public lhs!: string | number | boolean | Array<boolean | string | number>;
  public operator: string;
  public rhs!: string | number | boolean | Array<boolean | string | number>;
}

export class AndJobCondition {
  public and!: Array<AndJobCondition | OrJobCondition | JobCondition>;
}

export class OrJobCondition {
  public or!: Array<AndJobCondition | OrJobCondition | JobCondition>;
}

export class EventSubscriptionSource {
  type: 'git';
  url: string;
  avatarUrl: string;
}

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

  // true for a built-in subsctiption, false otherwise
  @Prop()
  public builtIn?: boolean;

  @Prop()
  public file?: string;

  @Prop()
  public discriminator?: string;

  @Prop()
  public source?: EventSubscriptionSource;
}

export const EventSubscriptionsSchema =
  SchemaFactory.createForClass(EventSubscription);
