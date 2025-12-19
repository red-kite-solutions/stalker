import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { isNullOrUndefined } from '@typegoose/typegoose/lib/internal/utils';
import {
  isArray,
  isEmpty,
  isMongoId,
  isNotEmpty,
  isNumber,
  isPositive,
  isString,
} from 'class-validator';
import { Document, Types } from 'mongoose';
import { JobParameterValueException } from '../../../../exceptions/job-parameter.exception';
import { JobParameterDefinition } from '../../../../types/job-parameter-definition.type';
import { TimestampedString } from '../../../../types/timestamped-string.type';
import {
  environmentVariableConflict,
  environmentVariableRegex,
} from '../../../../utils/linux-environment-variables.utils';
import { isProjectId } from '../../../../validators/is-project-id.validator';
import { JobParameter } from '../../subscriptions/subscriptions.type';
import { JobFactoryUtils } from '../jobs.factory';
import { Job } from './jobs.model';

export type JobDocument = CustomJob & Document;

export const customJobTypes = ['code', 'nuclei'] as const;
export const customJobLanguages = ['python', 'yaml'] as const;
export const customJobFindingHandlerLanguages = ['python'] as const;

export type CustomJobType = (typeof customJobTypes)[number];
export type CustomJobLanguage = (typeof customJobLanguages)[number];
export type CustomJobFindingHandlerLanguage =
  (typeof customJobFindingHandlerLanguages)[number];

export interface CustomJobTypeDetails {
  type: CustomJobType;
  language: CustomJobLanguage;
  handlerLanguage: CustomJobFindingHandlerLanguage;
}

export const validCustomJobTypeDetails: CustomJobTypeDetails[] = [
  {
    type: 'code',
    language: 'python',
    handlerLanguage: undefined, // handler not supported for code custom jobs
  },
  {
    type: 'nuclei',
    language: 'yaml',
    handlerLanguage: 'python',
  },
];

export const languageExtensionMapping = {
  python: 'py',
  py: 'python',
  yaml: 'yaml',
};

export interface JobSource {
  type: 'git';
  url: string;
  avatarUrl: string;
}

@Schema()
export class CustomJob {
  public task: string;
  public projectId!: string;
  public priority!: number;
  public output: TimestampedString[];
  public publishTime: number;
  public startTime: number;
  public endTime: number;
  public createdAt: number;

  @ApiProperty()
  @Prop()
  public name: string;

  @ApiProperty()
  @Prop()
  public customJobParameters!: JobParameter[];

  @ApiProperty()
  @Prop()
  public jobPodConfigId!: Types.ObjectId;

  @ApiProperty()
  @Prop()
  public jobPodMilliCpuLimit: number;

  @ApiProperty()
  @Prop()
  public jobPodMemoryKbLimit: number;

  @ApiProperty()
  @Prop()
  public jobModelId: string;

  constructor() {}

  // No parameter definition for custom jobs since we cannot know
  // the parameters in advance, at least not in that way
  public static parameterDefinitions: JobParameterDefinition[] = [];

  public static create(args: JobParameter[]): Job {
    let params = {};
    params['projectid'] = undefined;
    params['jobpodmillicpulimit'] = undefined;
    params['jobpodmemorykblimit'] = undefined;
    params['customjobparameters'] = undefined;
    params['jobmodelid'] = undefined;
    params['name'] = undefined;

    params = JobFactoryUtils.bindFunctionArguments(params, args);

    return CustomJob.createCustomJob(
      params['projectid'],
      params['jobpodmillicpulimit'],
      params['jobpodmemorykblimit'],
      params['customjobparameters'],
      params['jobmodelid'],
      params['name'],
    );
  }

  private static createCustomJob(
    projectId: string,
    jobPodMilliCpuLimit: number,
    jobPodMemoryKbLimit: number,
    customJobParameters: JobParameter[],
    jobModelId: string,
    name: string,
  ) {
    const job = new CustomJob();
    job.task = CustomJob.name;
    job.projectId = projectId;
    job.priority = 3;
    job.jobPodMilliCpuLimit = jobPodMilliCpuLimit;
    job.jobPodMemoryKbLimit = jobPodMemoryKbLimit;
    job.jobModelId = jobModelId;
    job.customJobParameters = customJobParameters;
    job.name = name;

    if (!isProjectId(job.projectId)) {
      throw new JobParameterValueException('projectId', job.projectId);
    }

    if (
      !isArray(job.customJobParameters) ||
      job.customJobParameters.some(
        (param) =>
          isEmpty(param.name) ||
          !isString(param.name) ||
          !environmentVariableRegex.test(param.name) ||
          environmentVariableConflict.some((v) => v === param.name) ||
          isNullOrUndefined(param.value),
      )
    ) {
      throw new JobParameterValueException(
        'customJobParameters',
        JSON.stringify(job.customJobParameters),
      );
    }

    if (
      !isNumber(job.jobPodMilliCpuLimit) ||
      !isPositive(job.jobPodMilliCpuLimit)
    ) {
      throw new JobParameterValueException(
        'jobPodMilliCpuLimit',
        job.jobPodMilliCpuLimit,
      );
    }

    if (
      !isNumber(job.jobPodMemoryKbLimit) ||
      !isPositive(job.jobPodMemoryKbLimit)
    ) {
      throw new JobParameterValueException(
        'jobPodMemoryKbLimit',
        job.jobPodMemoryKbLimit,
      );
    }

    if (!isMongoId(job.jobModelId)) {
      throw new JobParameterValueException('jobModelId', job.jobModelId);
    }

    if (!isString(job.name) || !isNotEmpty(job.name)) {
      throw new JobParameterValueException('name', job.name);
    }

    return job;
  }
}

export const CustomJobSchema = SchemaFactory.createForClass(CustomJob);
