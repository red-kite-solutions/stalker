import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobDto } from './jobs.dto';
import { Job } from './jobs.model';
import { DomainNameResolvingJob } from './jobs_factory/domain_name_resolving.job';
import { ManufacturedJob } from './jobs_factory/manufactured_job';
import { SubdomainBruteforceJob } from './jobs_factory/subdomain_bruteforce.job';

export enum JobTypes {
  DOMAIN_NAME_RESOLVING = 'DOMAIN_NAME_RESOLVING',
  SUBDOMAIN_BRUTEFORCE = 'SUBDOMAIN_BRUTEFORCE',
}

@Injectable()
export class JobsService {
  constructor(
    @InjectModel('job') private readonly jobModel: Model<Job & Document>,
  ) {}

  public async create(dto: CreateJobDto): Promise<Job> {
    const job = new this.jobModel(dto);
    return await job.save();
  }

  public async getAll(page = 0, pageSize = 100): Promise<Job[]> {
    return await this.jobModel.find().skip(page).limit(pageSize);
  }

  public async delete(id: string) {
    // TODO: We should probably make the job id the model's id
    await this.jobModel.deleteMany({ jobId: { $eq: id } });
  }

  public async getById(id: string): Promise<Job> {
    return await this.jobModel.findOne({ jobId: { $eq: id } });
  }

  public manufactureJob(jobType: string, program: string): ManufacturedJob {
    switch (jobType) {
      case JobTypes.DOMAIN_NAME_RESOLVING:
        return new DomainNameResolvingJob(this, program);

      case JobTypes.SUBDOMAIN_BRUTEFORCE:
        return new SubdomainBruteforceJob(this, program);
    }
    return null;
  }
}
