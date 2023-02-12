import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { isArray, isInt, isNumber } from 'class-validator';
import { Document } from 'mongoose';
import { isIP } from 'net';
import { JobParameterValueException } from '../../../../exceptions/job-parameter.exception';
import { JobParameterDefinition } from '../../../../types/job-parameter-definition.type';
import { isCompanyId } from '../../../../validators/isCompanyId.validator';
import { JobParameter } from '../../subscriptions/subscriptions.model';
import { JobFactoryUtils } from '../jobs.factory';

export type JobDocument = TcpPortScanningJob & Document;

@Schema()
export class TcpPortScanningJob {
  public task: string;
  public companyId!: string;
  public priority!: number;
  public output: string[];
  public startTime: number;
  public endTime: number;

  @Prop()
  public targetIp!: string;
  @Prop()
  public threads!: number;
  @Prop()
  public socketTimeoutSeconds!: number;
  @Prop()
  public portMin!: number;
  @Prop()
  public portMax!: number;
  @Prop()
  public ports!: number[];

  public static parameterDefinitions: JobParameterDefinition[] = [
    { name: 'targetIp', type: 'string', default: undefined },
    { name: 'threads', type: 'number', default: 100 },
    { name: 'socketTimeoutSeconds', type: 'number', default: 0.7 },
    { name: 'portMin', type: 'number', default: 1 },
    { name: 'portMax', type: 'number', default: 1000 },
    { name: 'ports', type: 'number[]', default: [] },
  ];

  private static createTcpPortScanJob(
    companyId: string,
    targetIp: string,
    threads: number,
    socketTimeoutSeconds: number,
    portMin: number,
    portMax: number,
    ports: number[] = [],
  ) {
    const job = new TcpPortScanningJob();
    job.task = TcpPortScanningJob.name;
    job.priority = 3;
    job.companyId = companyId;
    job.targetIp = targetIp;
    job.threads = threads;
    job.socketTimeoutSeconds = socketTimeoutSeconds;
    job.portMin = portMin;
    job.portMax = portMax;
    job.ports = ports;

    if (!isCompanyId(job.companyId)) {
      throw new JobParameterValueException('companyId', job.companyId);
    }

    if (isIP(job.targetIp) !== 4) {
      throw new JobParameterValueException('targetIp', job.targetIp);
    }

    if (!isInt(job.threads) || !(job.threads > 0 && job.threads <= 1000)) {
      throw new JobParameterValueException('threads', job.threads);
    }

    if (
      !isNumber(job.socketTimeoutSeconds) ||
      !(job.socketTimeoutSeconds > 0 && job.socketTimeoutSeconds <= 3)
    ) {
      throw new JobParameterValueException(
        'socketTimeoutSeconds',
        job.socketTimeoutSeconds,
      );
    }

    if (!isInt(job.portMin) || !(job.portMin > 0 && job.portMin < 65535)) {
      throw new JobParameterValueException('portMin', job.portMin);
    }

    if (
      !isInt(job.portMax) ||
      !(job.portMax > 1 && job.portMax <= 65535 && job.portMax > job.portMin)
    ) {
      throw new JobParameterValueException('portMax', job.portMax);
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
    params['threads'] = undefined;
    params['sockettimeoutseconds'] = undefined;
    params['portmin'] = undefined;
    params['portmax'] = undefined;
    params['ports'] = undefined;

    params = JobFactoryUtils.bindFunctionArguments(params, args);

    return TcpPortScanningJob.createTcpPortScanJob(
      params['companyid'],
      params['targetip'],
      params['threads'],
      params['sockettimeoutseconds'],
      params['portmin'],
      params['portmax'],
      params['ports'],
    );
  }
}

export const TcpPortScanningJobSchema =
  SchemaFactory.createForClass(TcpPortScanningJob);
