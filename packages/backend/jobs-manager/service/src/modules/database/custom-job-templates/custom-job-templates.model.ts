import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { JobParameterDefinition } from '../../../types/job-parameter-definition.type';
import { JobContainerSummary } from '../container/job-container.model';
import { DataSource } from '../data-source/data-source.model';

export type CustomJobTemplateDocument = CustomJobTemplate & Document;

@Schema()
export class CustomJobTemplate {
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
  category?: string;

  @Prop()
  source: DataSource;

  @Prop()
  container: JobContainerSummary;
}

export const CustomJobTemplateSchema =
  SchemaFactory.createForClass(CustomJobTemplate);
