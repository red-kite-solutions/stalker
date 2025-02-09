import { Injectable, Logger } from '@nestjs/common';
import { JobManagementQueue } from './job-management-queue';
import { KafkaJobManagementTask } from './kafka-job-management-queue';

@Injectable()
export class NullJobManagementQueue implements JobManagementQueue {
  private logger = new Logger(NullJobManagementQueue.name);

  public async publish(...jobManagementTasks: KafkaJobManagementTask[]) {
    this.logger.debug('Job management not posted to queue');
  }
}
