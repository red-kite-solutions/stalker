import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Host } from '../host/host.model';

export type DomainDocument = Domain & Document;

@Schema()
export class Domain {
  @Prop()
  public name!: string;

  @Prop()
  public isRawIp!: boolean;

  @Prop()
  public subdomains?: Domain[];

  @Prop()
  public hosts?: Host[];
}

export const DomainSchema = SchemaFactory.createForClass(Domain);
