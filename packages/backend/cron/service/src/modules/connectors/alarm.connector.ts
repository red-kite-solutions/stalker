import { Injectable } from '@nestjs/common';
import fetch, { Headers } from 'node-fetch';

@Injectable()
export class AlarmConnector {
  public async notify(path: string) {
    const headers = new Headers();
    path = path.startsWith('/') ? path : '/' + path;
    headers.append('x-stalker-cron', process.env.STALKER_CRON_API_TOKEN);
    await fetch(`${process.env.JM_URL}${path}`, {
      method: 'POST',
      headers: headers,
    });
  }
}
