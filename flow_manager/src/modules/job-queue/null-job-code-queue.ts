import { Injectable, Logger } from '@nestjs/common';
import { CustomJobEntry } from '../database/custom-jobs/custom-jobs.model';
import { JobCodeQueue } from './job-code-queue';

@Injectable()
export class NullJobCodeQueue implements JobCodeQueue {
  private logger = new Logger(NullJobCodeQueue.name);

  public async publish(...jobCodeUpdates: CustomJobEntry[]) {
    this.logger.debug('Job code updates not posted to job code queue.');
  }
}
