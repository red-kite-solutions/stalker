import { Injectable, Logger } from '@nestjs/common';
import { Message, Producer } from 'kafkajs';
import { orchestratorConstants } from '../../auth/constants';
import { Finding } from '../../findings/findings.service';
import { FindingsQueue } from './findings-queue';

@Injectable()
export class KafkaFindingsQueue implements FindingsQueue {
  private logger = new Logger(KafkaFindingsQueue.name);

  constructor(private producer: Producer) {}

  public async publish(projectId: string, ...findings: any[]) {
    this.publishForJob(undefined, projectId, ...findings);
  }

  public async publishForJob(
    jobId: string,
    projectId: string,
    ...findings: Finding[]
  ): Promise<void> {
    if (!findings.length) return;

    this.logger.debug(
      `Publishing ${findings.length} findings to the message queue on topic ${
        orchestratorConstants.topics.findings
      }: ${JSON.stringify(findings)}.`,
    );

    const serializedFindings: Message[] = [
      {
        key: null,
        value: JSON.stringify({
          FindingsJson: JSON.stringify({ findings: findings }),
          JobId: jobId,
          ProjectId: projectId,
          Timestamp: Date.now(),
        }),
      },
    ];

    await this.producer.send({
      topic: orchestratorConstants.topics.findings,
      messages: serializedFindings,
    });
  }
}
