import { Injectable, Logger } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { JobQueue } from './job-queue';

@Injectable()
export class KafkaJobQueue implements JobQueue {
  private logger = new Logger(KafkaJobQueue.name);

  constructor(private producer: Producer) {}

  public async publish(...jobs: any[]) {
    this.logger.debug(
      `Publishing ${jobs.length} jobs to the message queue on topic ${
        orchestratorConstants.topics.jobRequests
      }: ${JSON.stringify(jobs)}.`,
    );

    // TODO: Before sending a custom job with a jobPodId, validate that it exists

    await this.producer.send({
      topic: orchestratorConstants.topics.jobRequests,
      messages: jobs,
    });
  }
}
