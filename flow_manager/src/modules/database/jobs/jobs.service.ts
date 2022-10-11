import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Kafka } from 'kafkajs';
import { Model } from 'mongoose';
import {
  featureFlags,
  orchestratorConstants,
} from 'src/modules/auth/constants';
import { JobsQueueUtils } from 'src/utils/jobs_queue.utils';
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
    if (featureFlags.orchestratorEnabled) {
      console.debug('Publishing job to orchestrator.');
      return await this.publishNew(job);
    } else {
      console.debug('Publishing job to job handler queue.');
      return await this.publishLegacy(job);
    }
  }

  private async publishNew(job: Job) {
    const createdJob = await this.jobModel.create(job);

    if (!process.env.TESTS) {
      console.info('This feature is not available while testing');
      // TODO: Extract in service, inject through DI
      const kafka = new Kafka({
        clientId: orchestratorConstants.clientId,
        brokers: orchestratorConstants.brokers,
      });

      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: orchestratorConstants.topics.jobRequests, // TODO: Put in constant or something.
        messages: [
          {
            key: createdJob.id,
            value: JSON.stringify({
              JobId: createdJob.id,
            }),
          },
        ],
      });
    }

    return {
      id: createdJob.id,
      ...job,
    };
  }

  private async publishLegacy(job: Job) {
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
