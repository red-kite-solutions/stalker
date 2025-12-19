import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../database.constants';

export type ApiKeyDocument = ApiKey & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class ApiKey {
  @ApiProperty()
  @Prop()
  public name: string;

  @Prop({ select: false, index: true, unique: true })
  public key: string;

  @ApiProperty()
  @Prop()
  public expiresAt: number;

  @ApiProperty()
  @Prop()
  public createdAt: number;

  @ApiProperty()
  @Prop({ index: true })
  public userId: Types.ObjectId;

  @ApiProperty()
  @Prop()
  public scopes: string[];

  @ApiProperty()
  @Prop()
  public userIsActive: boolean;

  @ApiProperty()
  @Prop()
  public active: boolean;

  @ApiProperty()
  @Prop()
  public updatedAt: number;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
