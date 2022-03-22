import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigDocument = Config & Document;

export class KeybaseConfig {
  @Prop()
  enabled?: boolean;

  @Prop()
  username?: string;

  @Prop({ select: false })
  paperkey?: string;

  @Prop()
  channelId?: string;
}

@Schema()
export class Config {
  @Prop()
<<<<<<< HEAD
  public isNewContentReported?: boolean;

  @Prop()
  keybaseConfig?: KeybaseConfig;
=======
  public IsNewContentReported: boolean;
>>>>>>> main
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
