import { Injectable } from '@nestjs/common';
import fetch, { Headers } from 'node-fetch';

@Injectable()
export class CronConnector {
  public async notify(cronSubscriptionId: string) {
    const headers = new Headers();
    headers.append('x-stalker-cron', process.env.STALKER_CRON_API_TOKEN);
    await fetch(
      `${process.env.JM_URL}/cron-subscriptions/${cronSubscriptionId}/notify`,
      { method: 'POST', headers: headers },
    );
  }
}
