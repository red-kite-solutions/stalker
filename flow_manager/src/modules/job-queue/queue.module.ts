import { Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { FindingsQueue } from './findings-queue';
import { JobQueue } from './job-queue';
import { KafkaFindingsQueue } from './kafka-findings-queue';
import { KafkaJobQueue } from './kafka-job-queue';
import { NullFindingsQueue } from './null-findings-queue';
import { NullJobQueue } from './null-job-queue';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: JobQueue,
      useFactory: async () => {
        if (process.env.TESTS) return new NullJobQueue();

        const kafka = new Kafka({
          clientId: orchestratorConstants.clientId,
          brokers: orchestratorConstants.brokers,
        });

        const producer = kafka.producer();
        await producer.connect();

        return new KafkaJobQueue(producer);
      },
    },
    {
      provide: FindingsQueue,
      useFactory: async () => {
        if (process.env.TESTS) return new NullFindingsQueue();

        const kafka = new Kafka({
          clientId: orchestratorConstants.clientId,
          brokers: orchestratorConstants.brokers,
        });

        const producer = kafka.producer();
        await producer.connect();

        return new KafkaFindingsQueue(producer);
      },
    },
  ],
  exports: [JobQueue, FindingsQueue],
})
export class QueueModule {
  public constructor() {}
}
