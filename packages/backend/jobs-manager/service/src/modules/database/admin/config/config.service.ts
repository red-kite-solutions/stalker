import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { Config } from './config.model';
import { DATABASE_INIT } from './config.provider';
import {
  JobPodConfiguration,
  JobPodConfigurationDocument,
} from './job-pod-config/job-pod-config.model';

@Injectable()
export class ConfigService {
  public PASSWORD_PLACEHOLDER = '********';

  constructor(
    @InjectModel('config') private readonly configModel: Model<Config>,
    @InjectModel('jobPodConfig')
    private readonly jobPodConfigModel: Model<JobPodConfiguration>,
    @Inject(DATABASE_INIT) configProvider,
  ) {}

  public async getAllJobPodConfigs(): Promise<JobPodConfigurationDocument[]> {
    return await this.jobPodConfigModel.find();
  }

  public async getJobPodConfig(
    id: string,
  ): Promise<JobPodConfigurationDocument> {
    return await this.jobPodConfigModel.findById(id);
  }

  public async createJobPodConfig(jpc: JobPodConfiguration) {
    return await this.jobPodConfigModel.create(jpc);
  }

  public async deleteJobPodConfig(id: string): Promise<DeleteResult> {
    return await this.jobPodConfigModel.deleteOne({
      _id: new Types.ObjectId(id),
    });
  }
}
