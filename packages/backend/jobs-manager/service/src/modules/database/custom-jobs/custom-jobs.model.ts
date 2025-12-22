import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { JobParameterDefinition } from '../../../types/job-parameter-definition.type';
import { JobContainerSummary } from '../container/job-container.model';
import { DataSource } from '../data-source/data-source.model';

export type CustomJobsDocument = CustomJobEntry & Document;

@Schema()
export class CustomJobEntry {
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

  @ApiProperty({ isArray: true, type: JobParameterDefinition })
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
  public category?: string;

  @ApiProperty()
  @Prop()
  public source?: DataSource;

  @ApiProperty()
  @Prop()
  public container: JobContainerSummary;
}

export const CustomJobsSchema = SchemaFactory.createForClass(CustomJobEntry);
