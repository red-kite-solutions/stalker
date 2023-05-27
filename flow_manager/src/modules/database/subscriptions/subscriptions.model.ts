import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionsDocument = Subscription & Document;

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
export class Subscription {
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
}

export const SubscriptionsSchema = SchemaFactory.createForClass(Subscription);
