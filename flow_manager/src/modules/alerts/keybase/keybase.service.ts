import { Injectable, Logger } from '@nestjs/common';
import Bot from 'keybase-bot';
import { Config } from 'src/modules/database/admin/config/config.model';
import { ConfigService } from 'src/modules/database/admin/config/config.service';
import { SendSimpleAlertDto } from './keybase.dto';

@Injectable()
export class KeybaseService {
  bot: Bot;
  private currentPaperkey: string;
  private logger = new Logger(KeybaseService.name);

  constructor(private configService: ConfigService) {
    this.bot = new Bot();
    this.initBot();
  }

  public async sendSimpleAlertMessage(messageContent: string) {
    const config = await this.configService.getConfigCleartextSecrets();

    await this.updateBotInitState(config);

    if (
      !this.bot?.myInfo() ||
      !config.keybaseConfig?.enabled ||
      !config.keybaseConfig?.channelId
    ) {
      return;
    }

    const message = {
      body: messageContent,
    };

    await this.bot.chat.send(config.keybaseConfig.channelId, message);
  }

  public async initBot() {
    const config = await this.configService.getConfigCleartextSecrets();
    const info = this.bot?.myInfo();

    if (info) {
      // bot is already initialized
      return;
    }

    if (!config) {
      // no config, no big deal, will retry if/when needed
      return;
    }

    this.initBotFromConfig(config);
  }

  private async initBotFromConfig(config: Config) {
    if (!config.keybaseConfig?.username || !config.keybaseConfig?.paperkey) {
      return;
    }

    try {
      await this.bot.init(
        config.keybaseConfig?.username,
        config.keybaseConfig?.paperkey,
      );
      this.currentPaperkey = config.keybaseConfig.paperkey;
    } catch (err) {
      this.bot = new Bot();
      this.logger.error('Error in keybase initialization', err);
    }
  }

  private async updateBotInitState(config: Config) {
    const info = this.bot?.myInfo();
    if (!info) {
      await this.initBotFromConfig(config);
      return;
    }

    if (
      config.keybaseConfig?.username == '' ||
      config.keybaseConfig?.paperkey == ''
    ) {
      await this.bot.deinit();
      this.bot = new Bot();
      return;
    }

    if (
      config.keybaseConfig?.username === info.username &&
      config.keybaseConfig?.paperkey === this.currentPaperkey
    ) {
      return;
    }

    await this.bot.deinit();
    this.bot = new Bot();
    await this.initBotFromConfig(config);
  }

  public async sendSimpleAlert(dto: SendSimpleAlertDto) {
    this.sendSimpleAlertMessage(dto.messageContent);
  }

  public async sendReportFile(reportPath: string) {
    const config = await this.configService.getConfigCleartextSecrets();

    await this.updateBotInitState(config);

    if (
      !this.bot?.myInfo() ||
      !config.keybaseConfig?.enabled ||
      !config.keybaseConfig?.channelId
    ) {
      return;
    }

    this.bot.chat.attach(config.keybaseConfig.channelId, reportPath);
  }
}
