import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Config } from './config.model';
import { SubmitConfigDto } from './config.dto';
<<<<<<< HEAD
import { DEFAULT_CONFIG } from './config.default';
import dot from 'dot-object';

@Injectable()
export class ConfigService extends BaseService<Config, Config> {
  public PASSWORD_PLACEHOLDER = '********';
=======

@Injectable()
export class ConfigService extends BaseService<Config> {
  public config: Config;
>>>>>>> main

  constructor(
    @InjectModel('config') private readonly configModel: Model<Config>,
  ) {
    super(configModel);
    this.findOne({}).then((c: Config) => {
<<<<<<< HEAD
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
=======
      if (!c) {
        c = new Config();
      }
      if (!(c.IsNewContentReported || c.IsNewContentReported === false)) {
        c.IsNewContentReported = false;
      }

      this.config = c;
      this.upsertOne({}, c);
    });
  }

  public async submitConfig(dto: SubmitConfigDto): Promise<void> {
    this.update({}, dto);
    this.syncConfig(dto);
  }

  private syncConfig(configUpdate: Partial<Config>): void {
    this.config.IsNewContentReported =
      configUpdate.IsNewContentReported ||
      configUpdate.IsNewContentReported === false
        ? configUpdate.IsNewContentReported
        : false;
>>>>>>> main
  }
}
