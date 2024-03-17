import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ unique: true })
  public email: string;

  @Prop()
  public firstName: string;

  @Prop()
  public lastName: string;

  @Prop({ select: false })
  public password: string;

  @Prop()
  public active: boolean;

  @Prop()
  public role: string;

  @Prop({ select: false })
  public refreshTokens: string[];
}

export const UsersSchema = SchemaFactory.createForClass(User);
