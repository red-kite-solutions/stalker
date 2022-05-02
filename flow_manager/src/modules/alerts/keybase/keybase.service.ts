import { Injectable } from '@nestjs/common';
import Bot from 'keybase-bot';
import { ConfigService } from 'src/modules/database/admin/config/config.service';
import { SendSimpleAlertDto } from './keybase.dto';

@Injectable()
export class KeybaseService {
  constructor(private configService: ConfigService) {}

  private async call(
    action: (bot: Bot, channelId: string, content: string) => Promise<void>,
    content: string,
  ) {
    const config = await this.configService.getConfigCleartextSecrets();
    if (
      !config.keybaseConfig?.username ||
      !config.keybaseConfig?.paperkey ||
      !config.keybaseConfig?.channelId ||
      !config.keybaseConfig?.enabled
    ) {
      return;
    }

    const bot = new Bot();
    await bot.init(
      config.keybaseConfig?.username,
      config.keybaseConfig?.paperkey,
    );

    try {
      await action(bot, config.keybaseConfig.channelId, content);
    } finally {
      bot?.deinit();
    }
  }

  public async sendSimpleAlert(dto: SendSimpleAlertDto) {
    await this.sendSimpleAlertMessage(dto.messageContent);
  }

  public async sendSimpleAlertMessage(messageContent: string) {
    await this.call(this.sendMessageAction, messageContent);
  }

  public async sendReportFile(reportPath: string) {
    await this.call(this.sendReportAction, reportPath);
  }

  private async sendReportAction(bot: Bot, channelId: string, content: string) {
    await bot.chat.attach(channelId, content);
  }

  private async sendMessageAction(
    bot: Bot,
    channelId: string,
    content: string,
  ) {
    const message = {
      body: content,
    };

    await bot.chat.send(channelId, message);
  }
}
