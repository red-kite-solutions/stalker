import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../exceptions/http.exceptions';
import { JobSummary } from '../../../types/job-summary.type';
import { JobModelUpdateQueue } from '../../job-queue/job-model-update-queue';
import {
  JobContainer,
  JobContainerDocument,
} from '../container/job-container.model';
import { CustomJobEntry, CustomJobsDocument } from './custom-jobs.model';
import { JobDto } from './jobs.dto';

@Injectable()
export class CustomJobsService {
  private logger = new Logger(CustomJobsService.name);

  constructor(
    @InjectModel('customJobs')
    private readonly customJobModel: Model<CustomJobEntry>,
    @InjectModel('jobContainers')
    private readonly containersModel: Model<JobContainer>,
    private readonly jobCodeQueue: JobModelUpdateQueue,
  ) {}

  public async create(dto: JobDto) {
    const container: JobContainerDocument = await this.containersModel.findById(
      dto.containerId,
    );

    if (!container) throw new HttpNotFoundException('Container id not found');

    const job: CustomJobEntry = {
      name: dto.name,
      code: dto.code,
      type: dto.type,
      language: dto.language,
      jobPodConfigId: new Types.ObjectId(dto.jobPodConfigId),
      findingHandlerEnabled: dto.findingHandlerEnabled,
      findingHandler: dto.findingHandler ?? undefined,
      findingHandlerLanguage: dto.findingHandlerLanguage ?? undefined,
      parameters: [],
      container: {
        id: container._id,
        image: container.image,
      },
    };
    const r = await this.customJobModel.create(job);
    this.jobCodeQueue.publish(r);
    return r;
  }

  public async duplicate(jobId: string) {
    const existingJob = await this.customJobModel.findById(
      new Types.ObjectId(jobId),
    );

    if (!existingJob) {
      throw new HttpNotFoundException(`JobId=${jobId} not found.`);
    }

    const job: CustomJobEntry = {
      code: existingJob.code,
      jobPodConfigId: existingJob.jobPodConfigId,
      language: existingJob.language,
      parameters: existingJob.parameters,
      type: existingJob.type,
      builtIn: false,
      category: existingJob.category,
      findingHandler: existingJob.findingHandler,
      findingHandlerLanguage: existingJob.findingHandlerLanguage,
      findingHandlerEnabled: existingJob.findingHandlerEnabled,
      name: `${existingJob.name} Copy`,
      source: undefined,
      container: existingJob.container,
    };

    const r = await this.customJobModel.create(job);
    this.jobCodeQueue.publish(r);
    return r;
  }

  public async getAll() {
    return await this.customJobModel.find({});
  }

  public async get(id: string) {
    return await this.customJobModel.findById(id);
  }

  public async getPick<K extends keyof CustomJobsDocument>(
    id: string,
    projection: string[],
  ): Promise<Pick<CustomJobsDocument, K>> {
    return await this.customJobModel.findById(id, projection);
  }

  public async getAllSummaries(): Promise<JobSummary[]> {
    return await this.customJobModel
      .find()
      .select(['-_id', 'name', 'parameters', 'builtIn', 'source']);
  }

  public async edit(id: string, dto: JobDto): Promise<CustomJobsDocument> {
    const container: JobContainerDocument = await this.containersModel.findById(
      dto.containerId,
    );
    if (!container) throw new HttpNotFoundException('Container id not found');

    const job: Partial<CustomJobEntry> = {
      name: dto.name,
      code: dto.code,
      type: dto.type,
      language: dto.language,
      jobPodConfigId: new Types.ObjectId(dto.jobPodConfigId),
      findingHandlerEnabled: dto.findingHandlerEnabled,
      findingHandler: dto.findingHandler ?? undefined,
      findingHandlerLanguage: dto.findingHandlerLanguage ?? undefined,
      container: {
        id: container._id,
        image: container.image,
      },
    };
    const r = await this.customJobModel.findOneAndUpdate(
      {
        _id: { $eq: new Types.ObjectId(id) },
      },
      job,
      { returnDocument: 'after' },
    );
    this.jobCodeQueue.publish(r);
    return r;
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.customJobModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
      source: { $eq: null },
    });
  }

  public async getByName(name: string): Promise<CustomJobsDocument> {
    return await this.customJobModel.findOne({ name: { $eq: name } });
  }

  public async getPickByName<K extends keyof CustomJobsDocument>(
    name: string,
    projection: (keyof CustomJobsDocument)[],
  ): Promise<Pick<CustomJobsDocument, K>> {
    return await this.customJobModel.findOne(
      { name: { $eq: name } },
      projection,
    );
  }

  public async syncCache() {
    const jobs = await this.customJobModel.find({});
    for (const job of jobs) {
      await this.jobCodeQueue.publish(job);
    }
  }
}
