import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Domain } from './domain/domain.model';

export type ProgramDocument = Program & Document;

@Schema()
export class Program {
  @Prop()
  public name: string;

  @Prop()
  public domains?: Domain[];

  @Prop()
  public ip_ranges?: Object[];
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
