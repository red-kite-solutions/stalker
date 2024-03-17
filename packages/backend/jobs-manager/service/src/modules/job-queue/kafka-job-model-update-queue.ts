import { Injectable, Logger } from '@nestjs/common';
import { Message, Producer } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { CustomJobsDocument } from '../database/custom-jobs/custom-jobs.model';
import { JobModelUpdateQueue } from './job-model-update-queue';

@Injectable()
export class KafkaJobModelUpdateQueue implements JobModelUpdateQueue {
  private logger = new Logger(KafkaJobModelUpdateQueue.name);

  constructor(private producer: Producer) {}

  public async publish(...jobModelUpdates: CustomJobsDocument[]) {
    for (const update of jobModelUpdates) {
      const id = update._id.toString();
      this.logger.debug(`Publishing job model update for jobId ${id}.`);

      const serializedJobModelUpdate: Message[] = [
        {
          value: JSON.stringify({ id: id, model: update }),
        },
      ];

      await this.producer.send({
        topic: orchestratorConstants.topics.jobModels,
        messages: serializedJobModelUpdate,
      });
    }
  }
}
