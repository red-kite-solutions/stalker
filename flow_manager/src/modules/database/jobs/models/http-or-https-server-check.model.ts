import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = HttpOrHttpsServerCheckJob & Document;

@Schema()
export class HttpOrHttpsServerCheckJob {
  public task: string;
  public companyId!: string;
  public priority!: number;

  @Prop()
  public targetIp!: string;

  @Prop()
  public ports!: number[];
}

export const HttpOrHttpsServerCheckJobShema = SchemaFactory.createForClass(
  HttpOrHttpsServerCheckJob,
);
