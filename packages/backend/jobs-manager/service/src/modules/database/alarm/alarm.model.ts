import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type AlarmDocument = Alarm & Document;

@Schema()
export class Alarm {
  @ApiProperty()
  @Prop({ unique: true })
  public name: string;

  @ApiProperty()
  @Prop()
  public isEnabled: boolean;

  @ApiProperty()
  @Prop()
  public path: string;

  @ApiProperty()
  @Prop()
  public cronExpression: string;
}

export const AlarmSchema = SchemaFactory.createForClass(Alarm);
