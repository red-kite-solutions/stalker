import { Injectable, Logger } from '@nestjs/common';
import { Message, Producer } from 'kafkajs';
import { orchestratorConstants } from '../../auth/constants';
import {
  CustomJobEntry,
  CustomJobsDocument,
} from '../../database/custom-jobs/custom-jobs.model';
import { JobModelUpdateQueue } from './job-model-update-queue';

export interface KafkaJobModelUpdate extends CustomJobEntry {
  image: string;
  _id: string;
}

@Injectable()
export class KafkaJobModelUpdateQueue implements JobModelUpdateQueue {
  private logger = new Logger(KafkaJobModelUpdateQueue.name);

  constructor(private producer: Producer) {}

  public async publish(...jobModelUpdates: CustomJobsDocument[]) {
    for (const update of jobModelUpdates) {
      const id = update._id.toString();
      this.logger.debug(`Publishing job model update for jobId ${id}.`);

      const modelUpdate: KafkaJobModelUpdate = {
        _id: update._id,
        name: update.name,
        code: update.code,
        container: update.container,
        jobPodConfigId: update.jobPodConfigId,
        language: update.language,
        parameters: update.parameters,
        type: update.type,
        builtIn: update.builtIn,
        category: update.category,
        findingHandler: update.findingHandler,
        findingHandlerEnabled: update.findingHandlerEnabled,
        findingHandlerLanguage: update.findingHandlerLanguage,
        image: update.container.image,
      };

      const serializedJobModelUpdate: Message[] = [
        {
          value: JSON.stringify({
            id: id,
            model: modelUpdate,
          }),
        },
      ];

      await this.producer.send({
        topic: orchestratorConstants.topics.jobModels,
        messages: serializedJobModelUpdate,
      });
    }
  }
}
