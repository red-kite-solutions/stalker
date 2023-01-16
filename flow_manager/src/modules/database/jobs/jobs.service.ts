import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  isArray,
  isEmpty,
  isFQDN,
  isIn,
  isInt,
  isMongoId,
  isNumber,
  isString,
} from 'class-validator';
import { Model } from 'mongoose';
import { isIP } from 'net';
import {
  JobParameterCountException,
  JobParameterValueException,
} from '../../../exceptions/job-parameter.exception';
import {
  environmentVariableConflict,
  environmentVariableRegex,
} from '../../../utils/linux-environment-variables.utils';
import { JobQueue } from '../../job-queue/job-queue';
import { JobParameter } from '../subscriptions/subscriptions.model';
import { CreateJobDto } from './dtos/create-job.dto';
import { JobDto } from './dtos/job.dto';
import {
  CustomJob,
  CustomJobLanguages,
  CustomJobTypes,
} from './models/custom-job.model';
import { DomainNameResolvingJob } from './models/domain-name-resolving.model';
import { Job, JobDocument } from './models/jobs.model';
import { TcpPortScanningJob } from './models/tcp-port-scanning.model';

@Injectable()
export class JobsService {
  private static logger = new Logger(JobsService.name);

  constructor(
    private jobQueue: JobQueue,
    @InjectModel('job') private readonly jobModel: Model<Job & Document>,
  ) {}

  public async create(dto: CreateJobDto): Promise<JobDto> {
    const job = new this.jobModel(dto);
    const savedJob = await job.save();
    return { id: savedJob.id, ...dto };
  }

  public async getAll(page = null, pageSize = null): Promise<JobDocument[]> {
    let query = this.jobModel.find();
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }

    return await query;
  }

  public async delete(id: string) {
    await this.jobModel.deleteOne({ _id: { $eq: id } });
  }

  public async deleteAllForCompany(companyId: string) {
    return await this.jobModel.deleteMany({
      companyId: { $eq: companyId },
    });
  }

  public async deleteAll() {
    await this.jobModel.deleteMany({});
  }

  public async getById(id: string): Promise<JobDocument> {
    return await this.jobModel.findById(id);
  }

  public static createDomainResolvingJob_(args: JobParameter[]) {
    let params = {};
    params['companyid'] = undefined;
    params['domainname'] = undefined;

    const jobName = DomainNameResolvingJob.name;

    try {
      params = JobsService.bindFunctionArguments(params, args);
    } catch (err) {
      JobsService.logJobInputError(
        jobName,
        `${err} (A parameter is likely missing)`,
      );
      return null;
    }

    return JobsService.createDomainResolvingJob(
      params['companyid'],
      params['domainname'],
    );
  }

  public static createDomainResolvingJob(
    companyId: string,
    domainName: string,
  ) {
    const job = new DomainNameResolvingJob();
    job.task = DomainNameResolvingJob.name;
    job.priority = 3;
    job.domainName = domainName;
    job.companyId = companyId;
    const jobName = DomainNameResolvingJob.name;

    if (!isMongoId(companyId)) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('companyId', job.companyId),
      );
      return null;
    }

    if (!isFQDN(domainName)) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('domainName', job.domainName),
      );
      return null;
    }

    return job;
  }

  private static bindFunctionArguments(
    params: { [key: string]: unknown },
    args: JobParameter[],
  ) {
    for (const arg of args) {
      params[arg.name.toLowerCase()] = arg.value;
    }

    for (const key of Object.keys(params)) {
      if (params[key] === undefined) {
        throw new JobParameterCountException(
          `The ${key} parameter was not filled by the provided arguments.`,
        );
      }
    }

    return params;
  }

  private static logJobInputError(jobName: string, msg: string | Error) {
    JobsService.logger.warn(`Ignoring the call to [${jobName}]: ${msg}`);
    // TODO: Log the errors for the user to see, will allow for simpler debugging of finding subscriptions
  }

  public static createTcpPortScanJob_(args: JobParameter[]) {
    let params = {};
    params['companyid'] = undefined;
    params['targetip'] = undefined;
    params['threads'] = undefined;
    params['sockettimeoutseconds'] = undefined;
    params['portmin'] = undefined;
    params['portmax'] = undefined;
    params['ports'] = undefined;
    const jobName = TcpPortScanningJob.name;

    try {
      params = JobsService.bindFunctionArguments(params, args);
    } catch (err) {
      JobsService.logJobInputError(
        jobName,
        `${err} (A parameter is likely missing)`,
      );
      return null;
    }

    return JobsService.createTcpPortScanJob(
      params['companyid'],
      params['targetip'],
      params['threads'],
      params['sockettimeoutseconds'],
      params['portmin'],
      params['portmax'],
      params['ports'],
    );
  }

  public static createSimpleTcpScanAllPortsJob(
    companyId: string,
    targetIp: string,
  ) {
    return JobsService.createTcpPortScanJob(
      companyId,
      targetIp,
      1000,
      0.7,
      1,
      65535,
    );
  }

  public static createSimpleTcpScan1000PortsJob(
    companyId: string,
    targetIp: string,
  ) {
    return JobsService.createTcpPortScanJob(
      companyId,
      targetIp,
      10,
      0.7,
      1,
      1000,
    );
  }

  public static createTcpPortScanJob(
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

    const jobName = TcpPortScanningJob.name;

    if (!isMongoId(job.companyId)) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('companyId', job.companyId),
      );
      return null;
    }

    if (isIP(job.targetIp) !== 4) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('targetIp', job.targetIp),
      );
      return null;
    }

    if (!isInt(job.threads) || !(job.threads > 0 && job.threads <= 1000)) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('threads', job.threads),
      );
      return null;
    }

    if (
      !isNumber(job.socketTimeoutSeconds) ||
      !(job.socketTimeoutSeconds > 0 && job.socketTimeoutSeconds <= 3)
    ) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException(
          'socketTimeoutSeconds',
          job.socketTimeoutSeconds,
        ),
      );
      return null;
    }

    if (!isInt(job.portMin) || !(job.portMin > 0 && job.portMin < 65535)) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('portMin', job.portMin),
      );
      return null;
    }

    if (
      !isInt(job.portMax) ||
      !(job.portMax > 1 && job.portMax <= 65535 && job.portMax > job.portMin)
    ) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('portMax', job.portMax),
      );
      return null;
    }

    if (
      !isArray(job.ports) ||
      job.ports.some((v) => !isInt(v) && v <= 0 && v > 65535)
    ) {
      JobsService.logJobInputError(
        jobName,
        new JobParameterValueException('ports', job.ports),
      );
      return null;
    }

    return job;
  }

  public static createCustomJob_(args: JobParameter[]) {
    let params = {};
    params['companyid'] = undefined;
    params['name'] = undefined;
    params['type'] = undefined;
    params['code'] = undefined;
    params['language'] = undefined;
    params['customjobparameters'] = undefined;

    const jobName = CustomJob.name;

    try {
      params = JobsService.bindFunctionArguments(params, args);
    } catch (err) {
      JobsService.logJobInputError(
        jobName,
        `${err} (A parameter is likely missing)`,
      );
      return null;
    }

    return JobsService.createCustomJob(
      params['companyid'],
      params['name'],
      params['type'],
      params['code'],
      params['language'],
      params['customjobparameters'],
    );
  }

  public static createCustomJob(
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
      JobsService.logJobInputError(
        job.task,
        new JobParameterValueException('companyId', job.companyId),
      );
      return null;
    }

    if (!isString(job.name) || isEmpty(job.name)) {
      JobsService.logJobInputError(
        job.task,
        new JobParameterValueException('name', job.name),
      );
      return null;
    }

    if (
      !isString(job.type) ||
      isEmpty(job.type) ||
      !isIn(job.type, CustomJobTypes)
    ) {
      JobsService.logJobInputError(
        job.task,
        new JobParameterValueException('type', job.type),
      );
      return null;
    }

    if (!isString(job.code) || isEmpty(job.code)) {
      JobsService.logJobInputError(
        job.task,
        new JobParameterValueException('code', job.code),
      );
      return null;
    }

    if (
      !isString(job.language) ||
      isEmpty(job.language) ||
      !isIn(job.language, CustomJobLanguages)
    ) {
      JobsService.logJobInputError(
        job.task,
        new JobParameterValueException('language', job.language),
      );
      return null;
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
      JobsService.logJobInputError(
        job.task,
        new JobParameterValueException(
          'customJobParameters',
          job.customJobParameters,
        ),
      );
      return null;
    }

    return job;
  }

  public async publish(job: Job) {
    const createdJob = await this.jobModel.create(job);

    if (!process.env.TESTS) {
      await this.jobQueue.publish({
        key: createdJob.id,
        value: JSON.stringify({
          jobId: createdJob.id,
          ...job,
        }),
      });
    } else {
      console.info('This feature is not available while testing');
    }

    return {
      id: createdJob.id,
      ...job,
    };
  }
}
