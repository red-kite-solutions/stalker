import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type JobPodConfigurationDocument = JobPodConfiguration & Document;

@Schema()
export class JobPodConfiguration {
  @ApiProperty()
  @Prop({ unique: true })
  name: string;

  @ApiProperty()
  @Prop()
  memoryKbytesLimit: number;

  @ApiProperty()
  @Prop()
  milliCpuLimit: number;
}

export const JobPodConfigSchema =
  SchemaFactory.createForClass(JobPodConfiguration);
