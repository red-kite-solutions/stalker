import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  isArray,
  isEmpty,
  isIn,
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
import { JobParameter } from '../../subscriptions/event-subscriptions/event-subscriptions.model';
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

@Schema()
export class CustomJob {
  public task: string;
  public projectId!: string;
  public priority!: number;
  public output: TimestampedString[];
  public publishTime: number;
  public startTime: number;
  public endTime: number;

  @Prop()
  public name!: string;

  @Prop()
  public type!: CustomJobType;

  @Prop()
  public code!: string;

  @Prop()
  public language!: CustomJobLanguage;

  @Prop()
  public customJobParameters!: JobParameter[];

  @Prop()
  public jobPodConfigId!: Types.ObjectId;

  @Prop()
  public jobPodMilliCpuLimit: number;

  @Prop()
  public jobPodMemoryKbLimit: number;

  @Prop()
  public findingHandler?: string;

  @Prop()
  public findingHandlerLanguage?: CustomJobFindingHandlerLanguage;

  constructor() {}

  // No parameter definition for custom jobs since we cannot know
  // the parameters in advance, at least not in that way
  public static parameterDefinitions: JobParameterDefinition[] = [];

  public static create(args: JobParameter[]): Job {
    let params = {};
    params['projectid'] = undefined;
    params['name'] = undefined;
    params['type'] = undefined;
    params['code'] = undefined;
    params['language'] = undefined;
    params['jobpodmillicpulimit'] = undefined;
    params['jobpodmemorykblimit'] = undefined;
    params['customjobparameters'] = undefined;
    params['findinghandlerenabled'] = undefined;
    params['findinghandler'] = undefined;
    params['findinghandlerlanguage'] = undefined;

    const optionalKeys = [
      'findinghandlerenabled',
      'findinghandler',
      'findinghandlerlanguage',
    ];

    params = JobFactoryUtils.bindFunctionArguments(params, args, optionalKeys);

    return CustomJob.createCustomJob(
      params['projectid'],
      params['name'],
      params['type'],
      params['code'],
      params['language'],
      params['jobpodmillicpulimit'],
      params['jobpodmemorykblimit'],
      params['customjobparameters'],
      params['findinghandlerenabled'],
      params['findinghandler'],
      params['findinghandlerlanguage'],
    );
  }

  private static createCustomJob(
    projectId: string,
    name: string,
    type: CustomJobType,
    code: string,
    language: CustomJobLanguage,
    jobPodMilliCpuLimit: number,
    jobPodMemoryKbLimit: number,
    customJobParameters: JobParameter[],
    findingHandlerEnabled: boolean,
    findingHandler: string,
    findingHandlerLanguage: CustomJobFindingHandlerLanguage,
  ) {
    const job = new CustomJob();
    job.task = CustomJob.name;
    job.projectId = projectId;
    job.priority = 3;
    job.name = name;
    job.code = code;
    job.type = type;
    job.language = language;
    job.jobPodMilliCpuLimit = jobPodMilliCpuLimit;
    job.jobPodMemoryKbLimit = jobPodMemoryKbLimit;
    job.customJobParameters = customJobParameters;
    if (findingHandlerEnabled) {
      job.findingHandler = findingHandler;
      job.findingHandlerLanguage = findingHandlerLanguage;
    }

    if (!isProjectId(job.projectId)) {
      throw new JobParameterValueException('projectId', job.projectId);
    }

    if (!isString(job.name) || isEmpty(job.name)) {
      throw new JobParameterValueException('name', job.name);
    }

    if (
      !isString(job.type) ||
      isEmpty(job.type) ||
      !isIn(job.type, customJobTypes)
    ) {
      throw new JobParameterValueException('type', job.type);
    }

    if (!isString(job.code) || isEmpty(job.code)) {
      throw new JobParameterValueException('code', job.code);
    }

    if (
      !isString(job.language) ||
      isEmpty(job.language) ||
      !isIn(job.language, customJobLanguages)
    ) {
      throw new JobParameterValueException('language', job.language);
    }

    if (
      !isArray(job.customJobParameters) ||
      job.customJobParameters.some(
        (param) =>
          isEmpty(param.name) ||
          !isString(param.name) ||
          !environmentVariableRegex.test(param.name) ||
          environmentVariableConflict.some((v) => v === param.name) ||
          isEmpty(param.value),
      )
    ) {
      throw new JobParameterValueException(
        'customJobParameters',
        job.customJobParameters,
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

    if (job.findingHandler && !isString(job.findingHandler)) {
      throw new JobParameterValueException(
        'findingHandler',
        job.findingHandler,
      );
    }

    if (job.findingHandlerLanguage && !isString(job.findingHandlerLanguage)) {
      throw new JobParameterValueException(
        'findingHandlerLanguage',
        job.findingHandlerLanguage,
      );
    }

    if (!job.findingHandlerLanguage && job.findingHandler) {
      throw new JobParameterValueException(
        'findingHandlerLanguage',
        'If a findingHandler is provided, a findingHandlerLanguage is required',
      );
    }

    if (
      job.findingHandler &&
      !validCustomJobTypeDetails.some((value) => {
        return (
          value.language === job.language &&
          value.type === job.type &&
          value.handlerLanguage === job.findingHandlerLanguage
        );
      })
    ) {
      throw new JobParameterValueException(
        'language, type and findingHandlerLanguage',
        `invalid combination of language ${job.language}, type ${job.type} and findingHandlerLanguage ${job.findingHandlerLanguage}`,
      );
    }

    return job;
  }
}

export const CustomJobSchema = SchemaFactory.createForClass(CustomJob);
