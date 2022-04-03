import { Injectable } from '@nestjs/common';
import Bot from 'keybase-bot';
import { ConfigDocument } from 'src/modules/database/admin/config/config.model';
import { ConfigService } from 'src/modules/database/admin/config/config.service';
import { SendSimpleAlertDto } from './keybase.dto';

@Injectable()
export class KeybaseService {
  bot: Bot;
  private currentPaperkey: string;

  constructor(private configService: ConfigService) {
    this.bot = new Bot();
    this.initBot();
  }

  public async sendSimpleAlertMessage(messageContent: string) {
    const config: ConfigDocument =
      await this.configService.getConfigCleartextSecrets();

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
    const config: ConfigDocument =
      await this.configService.getConfigCleartextSecrets();
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

  private async initBotFromConfig(config: ConfigDocument) {
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
      console.log('Error in keybase initialization');
      console.log(err);
    }
  }

  private async updateBotInitState(config: ConfigDocument) {
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
    const config: ConfigDocument =
      await this.configService.getConfigCleartextSecrets();

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
