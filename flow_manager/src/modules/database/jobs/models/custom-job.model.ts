import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { isArray, isEmpty, isIn, isMongoId, isString } from 'class-validator';
import { Document } from 'mongoose';
import { JobParameterValueException } from '../../../../exceptions/job-parameter.exception';
import {
  environmentVariableConflict,
  environmentVariableRegex,
} from '../../../../utils/linux-environment-variables.utils';
import { JobParameter } from '../../subscriptions/subscriptions.model';
import { JobFactoryUtils } from '../jobs.factory';
import { Job } from './jobs.model';

export type JobDocument = CustomJob & Document;

export const CustomJobTypes = ['code'];
export const CustomJobLanguages = ['python'];

@Schema()
export class CustomJob {
  public task: string;
  public companyId!: string;
  public priority!: number;

  @Prop()
  public name!: string;

  @Prop()
  public type!: string;

  @Prop()
  public code!: string;

  @Prop()
  public language!: string;

  @Prop()
  public customJobParameters!: JobParameter[];

  constructor() {}

  public static create(args: JobParameter[]): Job {
    let params = {};
    params['companyid'] = undefined;
    params['name'] = undefined;
    params['type'] = undefined;
    params['code'] = undefined;
    params['language'] = undefined;
    params['customjobparameters'] = undefined;

    params = JobFactoryUtils.bindFunctionArguments(params, args);

    return CustomJob.createCustomJob(
      params['companyid'],
      params['name'],
      params['type'],
      params['code'],
      params['language'],
      params['customjobparameters'],
    );
  }

  private static createCustomJob(
    companyId: string,
    name: string,
    type: string,
    code: string,
    language: string,
    customJobParameters: JobParameter[],
  ) {
    const job = new CustomJob();
    job.task = CustomJob.name;
    job.companyId = companyId;
    job.priority = 3;
    job.name = name;
    job.code = code;
    job.type = type;
    job.language = language;
    job.customJobParameters = customJobParameters;

    if (!isMongoId(job.companyId)) {
      throw new JobParameterValueException('companyId', job.companyId);
    }

    if (!isString(job.name) || isEmpty(job.name)) {
      throw new JobParameterValueException('name', job.name);
    }

    if (
      !isString(job.type) ||
      isEmpty(job.type) ||
      !isIn(job.type, CustomJobTypes)
    ) {
      throw new JobParameterValueException('type', job.type);
    }

    if (!isString(job.code) || isEmpty(job.code)) {
      throw new JobParameterValueException('code', job.code);
    }

    if (
      !isString(job.language) ||
      isEmpty(job.language) ||
      !isIn(job.language, CustomJobLanguages)
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

    return job;
  }
}

export const CustomJobSchema = SchemaFactory.createForClass(CustomJob);
