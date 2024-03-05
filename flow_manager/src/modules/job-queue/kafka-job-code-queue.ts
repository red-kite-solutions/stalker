import { Injectable, Logger } from '@nestjs/common';
import { Message, Producer } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { CustomJobsDocument } from '../database/custom-jobs/custom-jobs.model';
import { JobCodeQueue } from './job-code-queue';

@Injectable()
export class KafkaJobCodeQueue implements JobCodeQueue {
  private logger = new Logger(KafkaJobCodeQueue.name);

  constructor(private producer: Producer) {}

  public async publish(...jobCodeUpdates: CustomJobsDocument[]) {
    for (const update of jobCodeUpdates) {
      const id = update._id.toString();
      this.logger.debug(`Publishing job code update for jobId ${id}.`);

      const serializedJobCode: Message[] = [
        {
          key: id,
          value: JSON.stringify(update),
        },
      ];

      await this.producer.send({
        topic: orchestratorConstants.topics.jobModels,
        messages: serializedJobCode,
      });
    }
  }
}
