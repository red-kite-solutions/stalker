import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MagicLinkTokenDocument = MagicLinkToken & Document;

@Schema()
export class MagicLinkToken {
  @Prop({ unique: true })
  public token: string;

  @Prop()
  public userId: string;

  @Prop()
  public expirationDate: number;

  @Prop()
  public scopes: string[];
}

export const MagicLinkTokenSchema =
  SchemaFactory.createForClass(MagicLinkToken);
