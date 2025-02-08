import { Module } from '@nestjs/common';
import { Kafka, KafkaConfig } from 'kafkajs';
import { readFileSync } from 'node:fs';
import { isTest } from '../app.constants';
import { orchestratorConstants } from '../auth/constants';
import { FindingsQueue } from './findings-queue';
import { JobModelUpdateQueue } from './job-model-update-queue';
import { JobQueue } from './job-queue';
import { KafkaFindingsQueue } from './kafka-findings-queue';
import { KafkaJobModelUpdateQueue } from './kafka-job-model-update-queue';
import { KafkaJobQueue } from './kafka-job-queue';
import { NullFindingsQueue } from './null-findings-queue';
import { NullJobModelUpdateQueue } from './null-job-model-update-queue';
import { NullJobQueue } from './null-job-queue';

const certFolder =
  isTest() && process.env.TEST_TYPE === 'unit' ? '.' : '/certs';
const certTestExtension =
  isTest() && process.env.TEST_TYPE === 'unit' ? '.test' : '';

export const kafkaConfig: KafkaConfig = {
  clientId: orchestratorConstants.clientId,
  brokers: orchestratorConstants.brokers,
  ssl: {
    rejectUnauthorized: true,
    requestCert: true,
    ca: [
      isTest() && process.env.TEST_TYPE === 'unit'
        ? ''
        : readFileSync(
            `${certFolder}/kafka-ca.crt${certTestExtension}`,
            'utf-8',
          ),
    ],
    cert:
      isTest() && process.env.TEST_TYPE === 'unit'
        ? ''
        : readFileSync(
            `${certFolder}/kafka-client-signed.crt${certTestExtension}`,
            'utf-8',
          ),
    key:
      isTest() && process.env.TEST_TYPE === 'unit'
        ? ''
        : readFileSync(
            `${certFolder}/kafka-client.key${certTestExtension}`,
            'utf-8',
          ),
    passphrase: process.env.JM_KAFKA_KEY_PASSWORD,
  },
};

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: JobQueue,
      useFactory: async () => {
        if (isTest()) return new NullJobQueue();

        const kafka = new Kafka(kafkaConfig);

        const producer = kafka.producer();
        await producer.connect();

        return new KafkaJobQueue(producer);
      },
    },
    {
      provide: FindingsQueue,
      useFactory: async () => {
        if (isTest()) return new NullFindingsQueue();

        const kafka = new Kafka(kafkaConfig);

        const producer = kafka.producer();
        await producer.connect();

        return new KafkaFindingsQueue(producer);
      },
    },
    {
      provide: JobModelUpdateQueue,
      useFactory: async () => {
        if (isTest()) return new NullJobModelUpdateQueue();

        const kafka = new Kafka(kafkaConfig);

        const producer = kafka.producer();
        await producer.connect();

        return new KafkaJobModelUpdateQueue(producer);
      },
    },
  ],
  exports: [JobQueue, FindingsQueue, JobModelUpdateQueue],
})
export class QueueModule {
  public constructor() {}
}
