import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubmitConfigDto } from './config.dto';
import { Config } from './config.model';

@Injectable()
export class ConfigService {
  public config: Config;

  constructor(
    @InjectModel('config') private readonly configModel: Model<Config>,
  ) {
    // TODO: This probably shouldn't be done in the constructor. This leaves the class in
    //       an invalid state at the end of the constructor and this breaks OOD principle.
    this.configModel.findOne().then((c: Config) => {
      if (!c) {
        c = new Config();
      }
      if (!(c.IsNewContentReported || c.IsNewContentReported === false)) {
        c.IsNewContentReported = false;
      }

      this.config = c;
      this.configModel.updateOne({}, c, { upsert: true });
    });
  }

  public async submitConfig(dto: SubmitConfigDto): Promise<void> {
    this.configModel.updateOne({}, dto);
    this.syncConfig(dto);
  }

  private syncConfig(configUpdate: Partial<Config>): void {
    this.config.IsNewContentReported =
      configUpdate.IsNewContentReported ||
      configUpdate.IsNewContentReported === false
        ? configUpdate.IsNewContentReported
        : false;
  }
}
