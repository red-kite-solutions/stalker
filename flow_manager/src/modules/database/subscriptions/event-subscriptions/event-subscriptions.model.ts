import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventSubscriptionsDocument = EventSubscription & Document;

export class JobParameter {
  public name!: string;
  public value!: unknown;
}

export class JobCondition {
  public lhs!: string | number | boolean;
  public operator: string;
  public rhs!: string | number | boolean;
}

@Schema()
export class EventSubscription {
  @Prop()
  public name!: string;

  @Prop()
  public companyId?: Types.ObjectId;

  @Prop()
  public finding!: string;

  @Prop()
  public jobName!: string;

  @Prop()
  public jobParameters: JobParameter[];

  @Prop()
  public conditions: JobCondition[];

  @Prop()
  public cooldown: number;

  // true for a built-in subsctiption, false otherwise
  @Prop()
  public builtIn?: boolean;

  @Prop()
  public file?: string;
}

export const EventSubscriptionsSchema =
  SchemaFactory.createForClass(EventSubscription);
