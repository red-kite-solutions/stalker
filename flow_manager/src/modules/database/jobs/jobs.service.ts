import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobDto } from './dtos/create-job.dto';
import { JobDto } from './dtos/job.dto';
import { DomainNameResolvingJob } from './models/domain-name-resolving.model';
import { Job, JobDocument } from './models/jobs.model';
import { SubdomainBruteforceJob } from './models/subdomain-bruteforce.model';

@Injectable()
export class JobsService {
  constructor(
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
    // TODO: We should probably make the job id the model's id
    await this.jobModel.deleteMany({ jobId: { $eq: id } });
  }

  public async getById(id: string): Promise<JobDocument> {
    return await this.jobModel.findOne({ jobId: { $eq: id } });
  }

  public createDomainResolvingJob(domainName = '') {
    const job = new DomainNameResolvingJob();
    job.task = DomainNameResolvingJob.name;
    job.priority = 3;
    job.domain_name = domainName;
    return job;
  }

  public createSubdomainBruteforceJob(domainName = '', wordList = '') {
    const job = new SubdomainBruteforceJob();
    job.task = SubdomainBruteforceJob.name;
    job.priority = 3;
    job.domain_name = domainName;
    job.wordList = wordList;
    return job;
  }

  public publish(job: Job) {
    this.jobModel.create(job);
  }
}
