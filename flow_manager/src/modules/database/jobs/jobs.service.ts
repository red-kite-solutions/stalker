import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Page } from '../../../types/page.type';
import { TimestampedString } from '../../../types/timestamped-string.type';
import { CompanyUnassigned } from '../../../validators/isCompanyId.validator';
import { JobQueue } from '../../job-queue/job-queue';
import { JobLog, JobLogLevel } from './models/job-log.model';
import { Job, JobDocument } from './models/jobs.model';

@Injectable()
export class JobsService {
  constructor(
    private jobQueue: JobQueue,
    @InjectModel('job') private readonly jobModel: Model<Job & Document>,
    @InjectModel('jobLogs')
    private readonly jobLogsModel: Model<JobLog & Document>,
  ) {}

  public async getAll(page = null, pageSize = null): Promise<JobDocument[]> {
    let query = this.jobModel.find({}, {}, { sort: { startTime: -1 } });
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }

    return await query;
  }

  public async delete(id: string) {
    await this.jobModel.deleteOne({ _id: { $eq: id } });
  }

  public async deleteAllForCompany(companyId: string) {
    await this.jobModel.deleteMany({
      companyId: { $eq: companyId },
    });

    await this.jobLogsModel.deleteMany({
      companyId: { $eq: companyId },
    });
  }

  public async deleteAll() {
    await this.jobModel.deleteMany({});
    await this.jobLogsModel.deleteMany({});
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
        publishTime: Date.now(),
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

  public async addJobOutputLine(
    jobId: string,
    timestamp: number,
    line: string,
    level: JobLogLevel,
  ) {
    const str: TimestampedString = {
      timestamp: timestamp,
      value: line,
      level: level,
    };
    return await this.jobModel.updateOne(
      { _id: { $eq: new Types.ObjectId(jobId) } },
      { $push: { output: str } },
    );
  }

  public watchForJobOutput(jobId: string) {
    const pipeline = [
      { $match: { 'documentKey._id': new Types.ObjectId(jobId) } },
    ];
    return this.jobModel.collection.watch(pipeline);
  }

  public async updateJobStatus(
    jobId: string,
    status: string,
    timestamp: number,
  ) {
    const select = { _id: { $eq: new Types.ObjectId(jobId) } };
    switch (status.toLowerCase()) {
      case 'started':
        return await this.jobModel.updateOne(select, { startTime: timestamp });
      case 'success':
        return await this.jobModel.updateOne(select, { endTime: timestamp });
      default:
        return null;
    }
  }

  public async createLog(
    jobId: string,
    data: string,
    level: JobLogLevel,
    timestamp: number,
  ) {
    const job = await this.getById(jobId);
    if (job == null) {
      return;
    }

    this.jobLogsModel.create({
      companyId: job.companyId,
      jobId,
      data,
      level,
      timestamp,
    });
  }

  public async getLogs(
    jobId: string,
    page: number,
    pageSize: number,
  ): Promise<Page<JobLog>> {
    const filter = { jobId: { $eq: jobId } };

    const items = await this.jobLogsModel.find(filter, null, {
      skip: page * pageSize,
      limit: pageSize,
    });

    const totalRecords = await this.jobLogsModel.count(filter);

    return {
      items,
      totalRecords,
    };
  }
}
