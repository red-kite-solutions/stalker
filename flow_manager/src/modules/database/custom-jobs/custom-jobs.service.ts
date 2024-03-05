import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { JobSummary } from '../../../types/job-summary.type';
import { JobCodeQueue } from '../../job-queue/job-code-queue';
import { CustomJobDto } from './custom-jobs.dto';
import { CustomJobEntry, CustomJobsDocument } from './custom-jobs.model';

@Injectable()
export class CustomJobsService {
  private logger = new Logger(CustomJobsService.name);

  constructor(
    @InjectModel('customJobs')
    private readonly customJobModel: Model<CustomJobEntry>,
    private readonly jobCodeQueue: JobCodeQueue,
  ) {}

  public async create(dto: CustomJobDto) {
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

  public async getAllSummaries(): Promise<JobSummary[]> {
    return await this.customJobModel
      .find()
      .select(['-_id', 'name', 'parameters', 'builtIn']);
  }

  public async edit(
    id: string,
    dto: CustomJobDto,
  ): Promise<CustomJobsDocument> {
    const job: Partial<CustomJobEntry> = {
      name: dto.name,
      code: dto.code,
      type: dto.type,
      language: dto.language,
      jobPodConfigId: new Types.ObjectId(dto.jobPodConfigId),
      findingHandlerEnabled: dto.findingHandlerEnabled,
      findingHandler: dto.findingHandler ?? undefined,
      findingHandlerLanguage: dto.findingHandlerLanguage ?? undefined,
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
    });
  }

  public async getByName(name: string): Promise<CustomJobsDocument> {
    return await this.customJobModel.findOne({ name: { $eq: name } });
  }
}
