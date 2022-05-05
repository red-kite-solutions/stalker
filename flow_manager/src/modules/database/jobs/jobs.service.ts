import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpNotFoundException } from 'src/exceptions/http.exceptions';
import { JobsQueueUtils } from 'src/utils/jobs_queue.utils';
import { CompanyService } from '../reporting/company.service';
import { CreateJobDto } from './dtos/create-job.dto';
import { JobDto } from './dtos/job.dto';
import { DomainNameResolvingJob } from './models/domain-name-resolving.model';
import { Job, JobDocument } from './models/jobs.model';
import { SubdomainBruteforceJob } from './models/subdomain-bruteforce.model';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel('job') private readonly jobModel: Model<Job & Document>,
    private readonly companyService: CompanyService,
  ) {}

  public async create(dto: CreateJobDto): Promise<JobDto> {
    const company = await this.companyService.get(dto.companyId);
    if (!company) {
      throw new HttpNotFoundException();
    }
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

  public async publish(job: Job) {
    const company = await this.companyService.get(job.companyId);
    if (!company) {
      throw new HttpNotFoundException();
    }
    const createdJob = await this.jobModel.create(job);
    const success = await JobsQueueUtils.add({
      id: createdJob.id,
      ...job,
    });

    if (!success) {
      throw new HttpException('Error sending the job to the job queue.', 500);
    }

    return {
      id: createdJob.id,
      ...job,
    };
  }
}
