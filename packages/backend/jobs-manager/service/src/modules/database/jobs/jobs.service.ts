import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ChangeStream, ChangeStreamDocument, UpdateResult } from 'mongodb';
import { Document, Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../exceptions/http.exceptions';
import { JobLog } from '../../../types/job-log.model';
import { Page } from '../../../types/page.type';
import {
  JobLogLevel,
  TimestampedString,
} from '../../../types/timestamped-string.type';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { JM_ENVIRONMENTS } from '../../app.constants';
import { JobQueue } from '../../job-queue/job-queue';
import { ConfigService } from '../admin/config/config.service';
import { Project } from '../reporting/project.model';
import { JobExecutionsDto } from './jobs.dto';
import { CustomJob } from './models/custom-job.model';
import { Job, JobDocument } from './models/jobs.model';

@Injectable()
export class JobsService {
  constructor(
    private configService: ConfigService,
    private jobQueue: JobQueue,
    @InjectModel('job') private readonly jobModel: Model<Job & Document>,
    @InjectModel('project') private readonly projectModel: Model<Project>,
  ) {}

  public async getAll(dto: JobExecutionsDto): Promise<Page<JobDocument>> {
    // Build filter
    const filters = {};
    if (dto.project) {
      filters['projectId'] = {
        $eq: new Types.ObjectId(dto.project),
      };
    }

    let itemsQuery = this.jobModel.find(
      filters,
      {},
      { sort: { startTime: -1 } },
    );
    if (dto.page != null && dto.pageSize != null) {
      itemsQuery = itemsQuery
        .skip(+dto.page * +dto.pageSize)
        .limit(+dto.pageSize);
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

  public async deleteAllForProject(projectId: string): Promise<void> {
    await this.jobModel.deleteMany({
      projectId: { $eq: projectId },
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
    if (job.projectId === ProjectUnassigned) {
      createdJob = await this.jobModel.create({
        ...job,
        projectId: undefined,
        publishTime: Date.now(),
      });
      createdJob.projectId = job.projectId;
    } else {
      if (!(await this.projectModel.findById(job.projectId)))
        throw new HttpNotFoundException(`Project ${job.projectId} not found`);
      createdJob = await this.jobModel.create(job);
    }

    // This part of the code ensures that every custom job parameter is sent as a string
    // Not sending a custom job parameter as a string will break the orchestrator's deserialization
    if (process.env.JM_ENVIRONMENT !== JM_ENVIRONMENTS.tests) {
      if (job.task === CustomJob.name) {
        let cJob = job as CustomJob;

        if (
          cJob.customJobParameters &&
          Array.isArray(cJob.customJobParameters)
        ) {
          for (let j = 0; j < cJob.customJobParameters.length; ++j) {
            if (
              !cJob.customJobParameters[j].value ||
              typeof cJob.customJobParameters[j].value === 'string'
            ) {
              continue;
            }

            cJob.customJobParameters[j].value = JSON.stringify(
              cJob.customJobParameters[j].value,
            );
          }
          job = cJob;
        }
      }

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
      case 'failed':
        await this.addJobOutputLine(jobId, timestamp, 'Job failed.', 'debug');
        return await this.jobModel.updateOne(select, { endTime: timestamp });
      default:
        return null;
    }
  }

  public async getLogs(jobId: string): Promise<Page<JobLog>> {
    const job: Job = await this.jobModel.findById(jobId);

    return {
      items:
        job.output
          ?.map((log) => ({
            projectId: job.projectId,
            jobId: jobId,
            level: log.level,
            value: log.value,
            timestamp: log.timestamp,
          }))
          .sort((a, b) => a.timestamp - b.timestamp) ?? [],
      totalRecords: job.output?.length ?? 0,
    };
  }

  /**
   * Deletes all the job runs older than `config.jobRunRetentionTimeSeconds`.
   */
  public async cleanup(): Promise<void> {
    const config = await this.configService.getConfig();
    const ttlMilliseconds = config.jobRunRetentionTimeSeconds * 1000;
    const now = Date.now();
    const oldestValidCreationDate = now - ttlMilliseconds;
    await this.jobModel.deleteMany({
      $or: [{ createdAt: { $lte: oldestValidCreationDate } }],
    });
  }
}
