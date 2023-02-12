import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { isArray, isInt, isMongoId } from 'class-validator';
import { Document } from 'mongoose';
import { isIP } from 'net';
import { JobParameterValueException } from '../../../../exceptions/job-parameter.exception';
import { JobParameter } from '../../subscriptions/subscriptions.model';
import { JobFactoryUtils } from '../jobs.factory';

export type JobDocument = HttpServerCheckJob & Document;

@Schema()
export class HttpServerCheckJob {
  public task: string;
  public companyId!: string;
  public priority!: number;

  @Prop()
  public targetIp!: string;

  @Prop()
  public ports!: number[];

  private static createHttpServerCheckJob(
    companyId: string,
    targetIp: string,
    ports: number[] = [],
  ) {
    const job = new HttpServerCheckJob();
    job.task = HttpServerCheckJob.name;
    job.priority = 3;
    job.companyId = companyId;
    job.targetIp = targetIp;
    job.ports = ports;

    if (!isMongoId(job.companyId)) {
      throw new JobParameterValueException('companyId', job.companyId);
    }

    if (isIP(job.targetIp) !== 4) {
      throw new JobParameterValueException('targetIp', job.targetIp);
    }

    if (
      !isArray(job.ports) ||
      job.ports.some((v) => !isInt(v) && v <= 0 && v > 65535)
    ) {
      throw new JobParameterValueException('ports', job.ports);
    }

    return job;
  }

  public static create(args: JobParameter[]) {
    let params = {};
    params['companyid'] = undefined;
    params['targetip'] = undefined;
    params['ports'] = undefined;

    params = JobFactoryUtils.bindFunctionArguments(params, args);

    return HttpServerCheckJob.createHttpServerCheckJob(
      params['companyid'],
      params['targetip'],
      params['ports'],
    );
  }
}

export const HttpServerCheckJobShema =
  SchemaFactory.createForClass(HttpServerCheckJob);
