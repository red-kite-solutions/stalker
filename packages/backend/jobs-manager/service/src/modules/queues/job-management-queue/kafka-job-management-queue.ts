import { Injectable, Logger } from '@nestjs/common';
import { Message, Producer } from 'kafkajs';
import { orchestratorConstants } from '../../auth/constants';
import { JobManagementTask } from '../../database/jobs/jobs.dto';
import { JobManagementQueue } from './job-management-queue';

export interface KafkaJobManagementTask {
  jobId: string;
  task: JobManagementTask;
}

@Injectable()
export class KafkaJobManagementQueue implements JobManagementQueue {
  private logger = new Logger(KafkaJobManagementQueue.name);

  constructor(private producer: Producer) {}

  public async publish(...jobManagementTasks: KafkaJobManagementTask[]) {
    this.logger.debug(
      `Publishing ${
        jobManagementTasks.length
      } tasks to the job management queue on topic ${
        orchestratorConstants.topics.jobManagement
      }: ${JSON.stringify(jobManagementTasks)}.`,
    );

    for (const task of jobManagementTasks) {
      const serializedTasks: Message[] = [
        {
          value: JSON.stringify(task),
        },
      ];

      await this.producer.send({
        topic: orchestratorConstants.topics.jobManagement,
        messages: serializedTasks,
      });
    }
  }
}
