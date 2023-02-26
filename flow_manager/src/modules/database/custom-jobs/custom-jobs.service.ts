import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobSummary } from '../../../types/job-summary.type';
import { JobSourceUserCreated } from '../jobs/job-model.module';
import { CustomJobDto } from './custom-jobs.dto';
import { CustomJobEntry } from './custom-jobs.model';

@Injectable()
export class CustomJobsService {
  private logger = new Logger(CustomJobsService.name);

  constructor(
    @InjectModel('customJobs')
    private readonly customJobModel: Model<CustomJobEntry>,
  ) {}

  public async create(dto: CustomJobDto) {
    const job: CustomJobEntry = {
      name: dto.name,
      code: dto.code,
      type: dto.type,
      language: dto.language,
      source: JobSourceUserCreated,
      parameters: [],
    };
    return await this.customJobModel.create(job);
  }

  public async getAll() {
    return await this.customJobModel.find({});
  }

  public async getAllSummaries(): Promise<JobSummary[]> {
    return await this.customJobModel
      .find()
      .select(['-_id', 'name', 'parameters', 'source']);
  }

  public async edit(id: string, dto: CustomJobDto) {
    const job: CustomJobEntry = {
      name: dto.name,
      code: dto.code,
      type: dto.type,
      language: dto.language,
      source: JobSourceUserCreated,
      parameters: [],
    };
    return await this.customJobModel.updateOne(
      {
        _id: { $eq: new Types.ObjectId(id) },
        source: { $eq: JobSourceUserCreated },
      },
      job,
    );
  }

  public async delete(id: string) {
    return await this.customJobModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
      source: { $eq: JobSourceUserCreated },
    });
  }

  public async getByName(name: string) {
    return await this.customJobModel.findOne({ name: { $eq: name } });
  }
}
