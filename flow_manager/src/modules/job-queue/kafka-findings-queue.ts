import { Injectable, Logger } from '@nestjs/common';
import { Message, Producer } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { FindingsQueue } from './findings-queue';

@Injectable()
export class KafkaFindingsQueue implements FindingsQueue {
  private logger = new Logger(KafkaFindingsQueue.name);

  constructor(private producer: Producer) {}

  public async publish(...findings: any[]) {
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
        }),
      },
    ];

    await this.producer.send({
      topic: orchestratorConstants.topics.findings,
      messages: serializedFindings,
    });
  }
}
