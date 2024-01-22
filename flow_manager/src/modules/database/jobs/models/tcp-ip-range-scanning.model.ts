import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { isArray, isInt } from 'class-validator';
import { Document } from 'mongoose';
import { isIP } from 'net';
import { JobParameterValueException } from '../../../../exceptions/job-parameter.exception';
import { JobParameterDefinition } from '../../../../types/job-parameter-definition.type';
import { TimestampedString } from '../../../../types/timestamped-string.type';
import { isCompanyId } from '../../../../validators/is-company-id.validator';
import { JobParameter } from '../../subscriptions/event-subscriptions/event-subscriptions.model';
import { JobFactoryUtils } from '../jobs.factory';

export type JobDocument = TcpIpRangeScanningJob & Document;

@Schema()
export class TcpIpRangeScanningJob {
  public task: string;
  public companyId!: string;
  public priority!: number;
  public output: TimestampedString[];
  public publishTime: number;
  public startTime: number;
  public endTime: number;

  @Prop()
  public targetIp!: string;
  @Prop()
  public targetMask!: number;
  @Prop()
  public rate!: number;
  @Prop()
  public portMin!: number;
  @Prop()
  public portMax!: number;
  @Prop()
  public ports!: number[];

  public static parameterDefinitions: JobParameterDefinition[] = [
    { name: 'targetIp', type: 'string', default: undefined },
    { name: 'targetMask', type: 'number', default: undefined },
    { name: 'rate', type: 'number', default: 100000 },
    { name: 'portMin', type: 'number', default: 1 },
    { name: 'portMax', type: 'number', default: 1000 },
    {
      name: 'ports',
      type: 'number[]',
      default: [3000, 3389, 8000, 8080, 8443],
    },
  ];

  private static createTcpIpRangeScanJob(
    companyId: string,
    targetIp: string,
    targetMask: number,
    rate: number,
    portMin: number,
    portMax: number,
    ports: number[] = [],
  ) {
    const job = new TcpIpRangeScanningJob();
    job.task = TcpIpRangeScanningJob.name;
    job.priority = 3;
    job.companyId = companyId;
    job.targetIp = targetIp;
    job.targetMask = targetMask;
    job.rate = rate;
    job.portMin = portMin;
    job.portMax = portMax;
    job.ports = ports;

    if (!isCompanyId(job.companyId)) {
      throw new JobParameterValueException('companyId', job.companyId);
    }

    if (isIP(targetIp) !== 4) {
      throw new JobParameterValueException('targetIp', job.targetIp);
    }

    if (!isInt(job.targetMask) || job.targetMask < 0 || job.targetMask > 32) {
      throw new JobParameterValueException('targetMask', job.targetMask);
    }

    if (!isInt(job.rate) || !(job.rate > 0 && job.rate <= 10000000)) {
      throw new JobParameterValueException('rate', job.rate);
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
    params['targetmask'] = undefined;
    params['rate'] = undefined;
    params['portmin'] = undefined;
    params['portmax'] = undefined;
    params['ports'] = undefined;

    params = JobFactoryUtils.bindFunctionArguments(params, args);

    return TcpIpRangeScanningJob.createTcpIpRangeScanJob(
      params['companyid'],
      params['targetip'],
      params['targetmask'],
      params['rate'],
      params['portmin'],
      params['portmax'],
      params['ports'],
    );
  }
}

export const TcpIpRangeScanningJobSchema = SchemaFactory.createForClass(
  TcpIpRangeScanningJob,
);
