import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ChangeStream,
  ChangeStreamDocument,
  DeleteResult,
  UpdateResult,
} from 'mongodb';
import { Document, Model, Types } from 'mongoose';
import { TimestampedString } from '../../../types/timestamped-string.type';
import { CompanyUnassigned } from '../../../validators/is-company-id.validator';
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

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
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
  ): Promise<UpdateResult> {
    const str: TimestampedString = { timestamp: timestamp, value: line };
    return await this.jobModel.updateOne(
      { _id: { $eq: new Types.ObjectId(jobId) } },
      { $push: { output: str } },
    );
  }

  public watchForJobOutput(
    jobId: string,
  ): ChangeStream<Document, ChangeStreamDocument<Document>> {
    const pipeline = [
      { $match: { 'documentKey._id': new Types.ObjectId(jobId) } },
    ];
    return <ChangeStream<Document, ChangeStreamDocument<Document>>>(
      this.jobModel.collection.watch(pipeline)
    );
  }

  public async updateJobStatus(
    jobId: string,
    status: string,
    timestamp: number,
  ): Promise<UpdateResult> {
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
}
