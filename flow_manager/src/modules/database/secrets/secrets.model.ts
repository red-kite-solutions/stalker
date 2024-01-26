import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SecretDocument = Secret & Document;

@Schema()
export class Secret {
  @Prop()
  public name: string;

  @Prop()
  public projectId?: Types.ObjectId;

  @Prop({ select: false })
  public value: string;
}

export const SecretSchema = SchemaFactory.createForClass(Secret);
SecretSchema.index({ name: 1, projectId: 1 }, { unique: true });
