import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HostSummary } from '../host/host.summary';
import { Tag } from '../tag.type';

export type DomainDocument = Domain & Document;

@Schema()
export class Domain {
  @Prop({ unique: true, index: true })
  public name!: string;

  @Prop()
  public companyId!: Types.ObjectId;

  @Prop()
  public hosts?: HostSummary[];

  @Prop()
  public tags?: Tag[];

  @Prop()
  public notes?: string;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);
