import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type MagicLinkTokenDocument = MagicLinkToken & Document;

@Schema()
export class MagicLinkToken {
  @ApiProperty()
  @Prop({ unique: true })
  public token: string;

  @ApiProperty()
  @Prop()
  public userId: string;

  @ApiProperty()
  @Prop()
  public expirationDate: number;

  @ApiProperty()
  @Prop()
  public scopes: string[];
}

export const MagicLinkTokenSchema =
  SchemaFactory.createForClass(MagicLinkToken);
