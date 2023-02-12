import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { getLogTimestamp } from '../../../utils/time.utils';
import { CompanyUnassigned } from '../../../validators/isCompanyId.validator';
import { JobQueue } from '../../job-queue/job-queue';
import { Job, JobDocument } from './models/jobs.model';

@Injectable()
export class JobsService {
  constructor(
    private jobQueue: JobQueue,
    @InjectModel('job') private readonly jobModel: Model<Job & Document>,
  ) {}

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

  public async publish(job: Job) {
    let createdJob: JobDocument;
    if (job.companyId === CompanyUnassigned) {
      createdJob = await this.jobModel.create({
        ...job,
        companyId: undefined,
        startTime: Date.now(),
      });
      createdJob.companyId = job.companyId;
    } else {
      createdJob = await this.jobModel.create(job);
    }

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
      startTime: createdJob.startTime,
      ...job,
    };
  }

  public async addJobOutputLine(jobId: string, line: string) {
    return await this.jobModel.updateOne(
      { _id: { $eq: new Types.ObjectId(jobId) } },
      { $push: { output: `${getLogTimestamp()} ${line}` } },
    );
  }

  public watchForJobOutput(jobId: string) {
    const pipeline = [
      // { $match: { 'fullDocument._id': new Types.ObjectId(jobId) } },
      // { $match: { operationType: 'update' } }
    ];
    return this.jobModel.collection.watch();
  }
}
