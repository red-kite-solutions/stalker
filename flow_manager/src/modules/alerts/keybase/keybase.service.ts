import { Injectable } from '@nestjs/common';
import Bot from 'keybase-bot';
import { SendSimpleAlertDto } from './keybase.dto';

@Injectable()
export class KeybaseService {
  bot: Bot;

  constructor() {
    this.bot = new Bot();
    this.bot.init(process.env.KB_USERNAME, process.env.KB_PAPERKEY);
  }

  public async sendSimpleAlertMessage(messageContent: string) {
    const message = {
      body: messageContent,
    };
    // const channel = {
    //     name: "alerts"
    // }
    // let chatConversations = await this.bot.chat.listChannels('team_name');
    // console.log(chatConversations);

    await this.bot.chat.send(process.env.KB_CHANNELID, message);
  }

  public async sendSimpleAlert(dto: SendSimpleAlertDto) {
    this.sendSimpleAlertMessage(dto.messageContent);
  }

  public async sendReportFile(reportPath: string) {
    this.bot.chat.attach(process.env.KB_CHANNELID, reportPath);
  }
}
