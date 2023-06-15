import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dot from 'dot-object';
import { Model } from 'mongoose';
import { SubmitConfigDto } from './config.dto';
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

  public async submitConfig(configUpdate: SubmitConfigDto): Promise<void> {
    const conf: Partial<Config> = {};

    if (!configUpdate) return;

    // Reporting
    if (
      configUpdate.isNewContentReported ||
      configUpdate.isNewContentReported === false
    )
      conf.isNewContentReported = configUpdate?.isNewContentReported;

    // Keybase Reporting
    if (
      configUpdate.keybaseConfigChannelId ||
      configUpdate.keybaseConfigChannelId === '' ||
      configUpdate.keybaseConfigUsername ||
      configUpdate.keybaseConfigUsername === '' ||
      configUpdate.keybaseConfigPaperkey ||
      configUpdate.keybaseConfigPaperkey === '' ||
      configUpdate.keybaseConfigEnabled ||
      configUpdate.keybaseConfigEnabled === false
    ) {
      conf.keybaseConfig = {};
      if (
        configUpdate.keybaseConfigChannelId ||
        configUpdate.keybaseConfigChannelId === ''
      )
        conf.keybaseConfig.channelId = configUpdate?.keybaseConfigChannelId;
      if (
        configUpdate.keybaseConfigUsername ||
        configUpdate.keybaseConfigUsername === ''
      )
        conf.keybaseConfig.username = configUpdate.keybaseConfigUsername;
      if (
        (configUpdate.keybaseConfigPaperkey ||
          configUpdate.keybaseConfigPaperkey === '') &&
        configUpdate.keybaseConfigPaperkey !== this.PASSWORD_PLACEHOLDER
      )
        conf.keybaseConfig.paperkey = configUpdate.keybaseConfigPaperkey;
      if (
        configUpdate.keybaseConfigEnabled ||
        configUpdate.keybaseConfigEnabled === false
      )
        conf.keybaseConfig.enabled = configUpdate?.keybaseConfigEnabled;
    }

    await this.configModel.updateOne({}, { $set: dot.dot(conf) });
  }

  public async getConfig(): Promise<Config> {
    const conf = await this.configModel.findOne({}).lean();

    if (conf.keybaseConfig?.paperkey) {
      conf.keybaseConfig.paperkey = this.PASSWORD_PLACEHOLDER;
    }

    return conf;
  }

  public async getAllJobPodConfigs(): Promise<JobPodConfiguration[]> {
    return await this.jobPodConfigModel.find();
  }

  public async getJobPodConfig(
    id: string,
  ): Promise<JobPodConfigurationDocument> {
    return await this.jobPodConfigModel.findById(id);
  }

  public async getConfigCleartextSecrets() {
    return this.configModel.findOne({}).lean();
  }
}
