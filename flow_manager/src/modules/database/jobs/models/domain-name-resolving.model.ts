import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { isFQDN } from 'class-validator';
import { Document } from 'mongoose';
import { JobParameterValueException } from '../../../../exceptions/job-parameter.exception';
import { JobParameterDefinition } from '../../../../types/job-parameter-definition.type';
import { TimestampedString } from '../../../../types/timestamped-string.type';
import { isCompanyId } from '../../../../validators/is-company-id.validator';
import { JobParameter } from '../../subscriptions/event-subscriptions/event-subscriptions.model';
import { JobFactoryUtils } from '../jobs.factory';

export type JobDocument = DomainNameResolvingJob & Document;

@Schema()
export class DomainNameResolvingJob {
  public task: string;
  public companyId!: string;
  public priority!: number;
  public output: TimestampedString[];
  public publishTime: number;
  public startTime: number;
  public endTime: number;

  @Prop()
  public domainName!: string;

  public static parameterDefinitions: JobParameterDefinition[] = [
    { name: 'domainName', type: 'string', default: undefined },
  ];

  private static createDomainResolvingJob(
    companyId: string,
    domainName: string,
  ) {
    const job = new DomainNameResolvingJob();
    job.task = DomainNameResolvingJob.name;
    job.priority = 3;
    job.domainName = domainName;
    job.companyId = companyId;
    const jobName = DomainNameResolvingJob.name;

    if (!isCompanyId(companyId)) {
      throw new JobParameterValueException('companyId', job.companyId);
    }

    if (!isFQDN(domainName)) {
      throw new JobParameterValueException('domainName', job.domainName);
    }

    return job;
  }

  public static create(args: JobParameter[]) {
    let params = {};
    params['companyid'] = undefined;
    params['domainname'] = undefined;

    params = JobFactoryUtils.bindFunctionArguments(params, args);

    return DomainNameResolvingJob.createDomainResolvingJob(
      params['companyid'],
      params['domainname'],
    );
  }
}

export const DomainNameResolvingJobSchema = SchemaFactory.createForClass(
  DomainNameResolvingJob,
);
