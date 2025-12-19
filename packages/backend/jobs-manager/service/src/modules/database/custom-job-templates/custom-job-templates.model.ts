import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { JobParameterDefinition } from '../../../types/job-parameter-definition.type';
import { JobContainerSummary } from '../container/job-container.model';
import { DataSource } from '../data-source/data-source.model';

export type CustomJobTemplateDocument = CustomJobTemplate & Document;

@Schema()
export class CustomJobTemplate {
  @ApiProperty()
  @Prop({ unique: true, index: true })
  public name!: string;

  @ApiProperty()
  @Prop()
  public code!: string;

  @ApiProperty()
  @Prop()
  public type!: string;

  @ApiProperty()
  @Prop()
  public language: string;

  @ApiProperty()
  @Prop()
  public builtIn?: boolean;

  @ApiProperty()
  @Prop()
  public parameters: JobParameterDefinition[];

  @ApiProperty()
  @Prop()
  public jobPodConfigId: Types.ObjectId;

  @ApiProperty()
  @Prop()
  public findingHandlerEnabled?: boolean;

  @ApiProperty()
  @Prop()
  public findingHandler?: string;

  @ApiProperty()
  @Prop()
  public findingHandlerLanguage?: string;

  @ApiProperty()
  @Prop()
  category?: string;

  @ApiProperty()
  @Prop()
  source: DataSource;

  @ApiProperty()
  @Prop()
  container: JobContainerSummary;
}

export const CustomJobTemplateSchema =
  SchemaFactory.createForClass(CustomJobTemplate);
