import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export interface ScopedUserDocument extends UserDocument {
  scopes: string[];
}

@Schema()
export class User {
  @ApiProperty()
  @Prop({ unique: true })
  public email: string;

  @ApiProperty()
  @Prop()
  public firstName: string;

  @ApiProperty()
  @Prop()
  public lastName: string;

  @Prop({ select: false })
  public password: string;

  @ApiProperty()
  @Prop()
  public active: boolean;

  @Prop({ select: false })
  public refreshTokens: string[];
}

export const UsersSchema = SchemaFactory.createForClass(User);
