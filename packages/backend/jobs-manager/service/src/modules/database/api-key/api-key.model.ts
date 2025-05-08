import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../auth/constants';
import { MONGO_TIMESTAMP_SCHEMA_CONFIG } from '../database.constants';

export type ApiKeyDocument = ApiKey & Document;

@Schema(MONGO_TIMESTAMP_SCHEMA_CONFIG)
export class ApiKey {
  @Prop()
  public name: string;

  @Prop({ select: false, index: true, unique: true })
  public key: string;

  @Prop()
  public expiresAt: number;

  @Prop()
  public createdAt: number;

  @Prop({ index: true })
  public userId: Types.ObjectId;

  @Prop()
  public scopes: string[];

  @Prop()
  public userIsActive: boolean;

  @Prop()
  public active: boolean;

  @Prop()
  public updatedAt: number;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
