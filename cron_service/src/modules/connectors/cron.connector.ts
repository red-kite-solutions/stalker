import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class CronConnector {
  public async notify(cronSubscriptionId: string) {
    const res = await fetch(`${process.env.FM_URL}/`);
    console.log(await res.text());
  }
}
