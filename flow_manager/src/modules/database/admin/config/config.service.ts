import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dot from 'dot-object';
import { Model } from 'mongoose';
import { BaseService } from 'src/services/base.service';
import { DEFAULT_CONFIG } from './config.default';
import { SubmitConfigDto } from './config.dto';
import { Config } from './config.model';

@Injectable()
export class ConfigService extends BaseService<Config> {
  public PASSWORD_PLACEHOLDER = '********';

  constructor(
    @InjectModel('config') private readonly configModel: Model<Config>,
  ) {
    super(configModel);
    this.findOne({}).then((c: Config) => {
      if (!c?.keybaseConfig) {
        // Check random config object to see if it was initialized
        c = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        this.upsertOne({}, c);
      }
    });
  }

  public async submitConfig(configUpdate: SubmitConfigDto): Promise<void> {
    const conf: Partial<Config> = {};

    // Reporting
    if (
      configUpdate?.isNewContentReported ||
      configUpdate?.isNewContentReported === false
    )
      conf.isNewContentReported = configUpdate?.isNewContentReported;

    // Keybase Reporting
    if (
      configUpdate?.keybaseConfigChannelId ||
      configUpdate?.keybaseConfigChannelId === '' ||
      configUpdate?.keybaseConfigUsername ||
      configUpdate?.keybaseConfigUsername === '' ||
      configUpdate?.keybaseConfigPaperkey ||
      configUpdate?.keybaseConfigPaperkey === '' ||
      configUpdate?.keybaseConfigEnabled ||
      configUpdate?.keybaseConfigEnabled === false
    ) {
      conf.keybaseConfig = {};
      if (
        configUpdate?.keybaseConfigChannelId ||
        configUpdate?.keybaseConfigChannelId === ''
      )
        conf.keybaseConfig.channelId = configUpdate?.keybaseConfigChannelId;
      if (
        configUpdate?.keybaseConfigUsername ||
        configUpdate?.keybaseConfigUsername === ''
      )
        conf.keybaseConfig.username = configUpdate.keybaseConfigUsername;
      if (
        (configUpdate?.keybaseConfigPaperkey ||
          configUpdate?.keybaseConfigPaperkey === '') &&
        configUpdate?.keybaseConfigPaperkey !== this.PASSWORD_PLACEHOLDER
      )
        conf.keybaseConfig.paperkey = configUpdate.keybaseConfigPaperkey;
      if (
        configUpdate?.keybaseConfigEnabled ||
        configUpdate?.keybaseConfigEnabled === false
      )
        conf.keybaseConfig.enabled = configUpdate?.keybaseConfigEnabled;
    }

    await this.model.update({}, { $set: dot.dot(conf) });
  }

  public async getConfig(): Promise<Config> {
    const conf: Config = await this.model.findOne({}).lean();

    if (conf.keybaseConfig?.paperkey) {
      conf.keybaseConfig.paperkey = this.PASSWORD_PLACEHOLDER;
    }

    return conf;
  }

  public async getConfigCleartextSecrets(): Promise<Config> {
    return this.model.findOne({}).lean();
  }
}
