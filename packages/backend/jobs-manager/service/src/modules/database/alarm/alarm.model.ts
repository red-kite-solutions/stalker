import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlarmDocument = Alarm & Document;

@Schema()
export class Alarm {
  @Prop({ unique: true })
  public name: string;

  @Prop()
  public isEnabled: boolean;

  @Prop()
  public path: string;

  @Prop()
  public cronExpression: string;
}

export const AlarmSchema = SchemaFactory.createForClass(Alarm);
