import { Injectable, Logger } from '@nestjs/common';
import { CustomJobEntry } from '../database/custom-jobs/custom-jobs.model';
import { JobModelUpdateQueue } from './job-model-update-queue';

@Injectable()
export class NullJobModelUpdateQueue implements JobModelUpdateQueue {
  private logger = new Logger(NullJobModelUpdateQueue.name);

  public async publish(...jobCodeUpdates: CustomJobEntry[]) {
    this.logger.debug('Job code updates not posted to job code queue.');
  }
}
