import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobQueue } from '../../job-queue/job-queue';
import { CreateJobDto } from './dtos/create-job.dto';
import { JobDto } from './dtos/job.dto';
import { DomainNameResolvingJob } from './models/domain-name-resolving.model';
import { Job, JobDocument } from './models/jobs.model';
import { SubdomainBruteforceJob } from './models/subdomain-bruteforce.model';
import { TcpPortScanningJob } from './models/tcp-port-scanning.model';

@Injectable()
export class JobsService {
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

  public createDomainResolvingJob(companyId: string, domainName: string) {
    const job = new DomainNameResolvingJob();
    job.task = DomainNameResolvingJob.name;
    job.priority = 3;
    job.domainName = domainName;
    job.companyId = companyId;
    return job;
  }

  public createSubdomainBruteforceJob(
    companyId: string,
    domainName: string,
    wordList: string,
  ) {
    const job = new SubdomainBruteforceJob();
    job.task = SubdomainBruteforceJob.name;
    job.priority = 3;
    job.domainName = domainName;
    job.wordList = wordList;
    job.companyId = companyId;
    return job;
  }

  public createSimpleTcpScanAllPortsJob(companyId: string, targetIp: string) {
    return this.createTcpPortScanJob(companyId, targetIp, 1000, 0.7, 1, 65535);
  }

  public createSimpleTcpScan1000PortsJob(companyId: string, targetIp: string) {
    return this.createTcpPortScanJob(companyId, targetIp, 10, 0.7, 1, 1000);
  }

  public createTcpPortScanJob(
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
