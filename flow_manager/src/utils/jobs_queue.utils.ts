import * as fetch from 'node-fetch';
import { JobDto } from 'src/modules/database/jobs/dtos/job.dto';

// TODO: Replace static class and methods by injectable service to increase testability.
export class JobsQueueUtils {
  public static async add(job: JobDto) {
    // add job to the database so that we remember what we sent

    // send job to the queue server
    const body = {
      id: job.id,
      task: job.task,
      priority: job.priority,
      data: job,
    };
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
