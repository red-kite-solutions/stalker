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

export type EventSubscriptionsDocument = EventSubscription & Document;

@Schema()
export class EventSubscription {
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
  public findings!: string[];

  @ApiProperty()
  @Prop()
  public jobName!: string;

  @ApiProperty()
  @Prop()
  public jobParameters: JobParameter[];

  @ApiProperty()
  @Prop()
  public conditions: Array<AndJobCondition | OrJobCondition | JobCondition>;

  @ApiProperty()
  @Prop()
  public cooldown: number;

  // true for a built-in subscription, false otherwise
  @ApiProperty()
  @Prop()
  public builtIn?: boolean;

  @ApiProperty()
  @Prop()
  public file?: string;

  @ApiProperty()
  @Prop()
  public discriminator?: string;

  @ApiProperty()
  @Prop()
  public source?: DataSource;
}

export const EventSubscriptionsSchema =
  SchemaFactory.createForClass(EventSubscription);
