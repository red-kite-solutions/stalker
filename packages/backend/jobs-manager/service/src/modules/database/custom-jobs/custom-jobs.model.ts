import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { JobParameterDefinition } from '../../../types/job-parameter-definition.type';
import { ContainerSummary } from '../container/container.model';
import { DataSource } from '../data-source/data-source.model';

export type CustomJobsDocument = CustomJobEntry & Document;

@Schema()
export class CustomJobEntry {
  @Prop({ unique: true, index: true })
  public name!: string;

  @Prop()
  public code!: string;

  @Prop()
  public type!: string;

  @Prop()
  public language: string;

  @Prop()
  public builtIn?: boolean;

  @Prop()
  public parameters: JobParameterDefinition[];

  @Prop()
  public jobPodConfigId: Types.ObjectId;

  @Prop()
  public findingHandlerEnabled?: boolean;

  @Prop()
  public findingHandler?: string;

  @Prop()
  public findingHandlerLanguage?: string;

  @Prop()
  public category?: string;

  @Prop()
  public source?: DataSource;

  @Prop()
  public container: ContainerSummary;
}

export const CustomJobsSchema = SchemaFactory.createForClass(CustomJobEntry);
