import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = TcpPortScanningJob & Document;

@Schema()
export class TcpPortScanningJob {
  public task: string;
  public companyId!: string;
  public priority!: number;

  @Prop()
  public targetIp!: string;
  @Prop()
  public threads!: number;
  @Prop()
  public socketTimeoutSeconds!: number;
  @Prop()
  public portMin!: number;
  @Prop()
  public portMax!: number;
  @Prop()
  public ports!: number[];
}

export const TcpPortScanningJobSchema =
  SchemaFactory.createForClass(TcpPortScanningJob);
