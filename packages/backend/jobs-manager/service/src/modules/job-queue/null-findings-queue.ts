import { Injectable, Logger } from '@nestjs/common';
import { FindingsQueue } from './findings-queue';

@Injectable()
export class NullFindingsQueue implements FindingsQueue {
  private logger = new Logger(NullFindingsQueue.name);

  public async publish(...findings: any[]) {
    this.publishForJob(undefined, ...findings);
  }

  public async publishForJob(...findings: any[]) {
    this.logger.debug('Findings not posted to findings queue.');
  }
}
