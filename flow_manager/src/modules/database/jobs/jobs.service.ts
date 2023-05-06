import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ChangeStream,
  ChangeStreamDocument,
  ObjectId,
  UpdateResult,
} from 'mongodb';
import { Document, Model, Types } from 'mongoose';
import { Page } from '../../../types/page.type';
import { TimestampedString } from '../../../types/timestamped-string.type';
import { CompanyUnassigned } from '../../../validators/is-company-id.validator';
import { JobQueue } from '../../job-queue/job-queue';
import { JobExecutionsDto } from './job-executions.dto';
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

  public async getAll(dto: JobExecutionsDto): Promise<Page<JobDocument>> {
    // Build filter
    const filters = {};
    if (dto.company) {
      filters['companyId'] = {
        $eq: new ObjectId(dto.company),
      };
    }

    let itemsQuery = this.jobModel.find(
      filters,
      {},
      { sort: { startTime: -1 } },
    );
    if (dto.page != null && dto.pageSize != null) {
      itemsQuery = itemsQuery.skip(+dto.page).limit(+dto.pageSize);
    }

    const items = await itemsQuery;
    const totalRecords = await this.jobModel.countDocuments(filters);

    return {
      items,
      totalRecords,
    };
  }

  public async delete(id: string) {
    await this.jobModel.deleteOne({ _id: { $eq: id } });
  }

  public async deleteAllForCompany(companyId: string): Promise<void> {
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

      await this.addJobOutputLine(
        createdJob.id,
        Date.now(),
        'Job sent to orchestrator.',
        'debug',
      );
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
  ): Promise<void> {
    const str: TimestampedString = {
      timestamp: timestamp,
      value: line,
      level: level,
    };
    await this.jobModel.updateOne(
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
        await this.addJobOutputLine(jobId, timestamp, 'Job started.', 'debug');
        return await this.jobModel.updateOne(select, { startTime: timestamp });
      case 'success':
        await this.addJobOutputLine(
          jobId,
          timestamp,
          'Job ended successfully.',
          'debug',
        );
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
    const job: Job = await this.jobModel.findById(jobId);

    return {
      items:
        job.output?.map((log) => ({
          companyId: job.companyId,
          jobId: jobId,
          level: log.level,
          value: log.value,
          timestamp: log.timestamp,
        })) ?? [],
      totalRecords: job.output?.length ?? 0,
    };
  }
}
