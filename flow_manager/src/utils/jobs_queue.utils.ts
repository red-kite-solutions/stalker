import * as fetch from 'node-fetch';

export class JobsQueueUtils {
  public static async add(
    id: string,
    task: string,
    priority: number,
    data: Object,
  ) {
    // add job to the database so that we remember what we sent

    // send job to the queue server
    const body = { id: id, task: task, priority: priority, data: data };
    const response = await fetch(`${process.env.JQH_ADDRESS}/job`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        API_KEY: process.env.JQH_API_KEY,
      },
    });

    return response.ok;
  }
}
