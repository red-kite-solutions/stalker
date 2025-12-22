import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type SecretDocument = Secret & Document;

@Schema()
export class Secret {
  @ApiProperty()
  @Prop()
  public name: string;

  @ApiProperty()
  @Prop()
  public projectId?: Types.ObjectId;

  @Prop({ select: false })
  public value: string;

  @ApiProperty()
  @Prop()
  public description?: string;
}

export const SecretSchema = SchemaFactory.createForClass(Secret);
SecretSchema.index({ name: 1, projectId: 1 }, { unique: true });
