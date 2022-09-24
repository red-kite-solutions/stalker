import { Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { JobQueue } from './job-queue';
import { KafkaJobQueue } from './kafka-job-queue';
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
  ],
  exports: [JobQueue],
})
export class JobQueueModule {
  public constructor() {}
}
