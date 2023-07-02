import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobPodConfigurationDocument = JobPodConfiguration & Document;

@Schema()
export class JobPodConfiguration {
  @Prop({ unique: true })
  name: string;

  @Prop()
  memoryKbytesLimit: number;

  @Prop()
  milliCpuLimit: number;
}

export const JobPodConfigSchema =
  SchemaFactory.createForClass(JobPodConfiguration);
