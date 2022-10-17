import { Injectable, Logger } from '@nestjs/common';
import { JobQueue } from './job-queue';

@Injectable()
export class NullJobQueue implements JobQueue {
  private logger = new Logger(NullJobQueue.name);

  public async publish(...jobs: any[]) {
    this.logger.debug('Job not posted to jobs queue.');
  }
}
