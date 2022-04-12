import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Company } from '../company.model';

export type ReportDocument = Report & Document;

export class DomainReport {
  public companyName!: string;
  public name!: string;
  public ips?: string[];
  public services?: string[];
}

export class HostReport {
  public companyName!: string;
  public ip!: string;
  public ports?: number[];
  public services?: string[];
}

@Schema()
export class Report {
  @Prop({ unique: true })
  public date: string;

  @Prop()
  public comments?: string[];

  @Prop()
  public domains?: DomainReport[];

  @Prop()
  public hosts?: HostReport[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);
