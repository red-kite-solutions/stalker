import { Module } from '@nestjs/common';
import { Kafka, KafkaConfig } from 'kafkajs';
import { readFileSync } from 'node:fs';
import { FM_ENVIRONMENTS } from '../app.constants';
import { orchestratorConstants } from '../auth/constants';
import { FindingsQueue } from './findings-queue';
import { JobQueue } from './job-queue';
import { KafkaFindingsQueue } from './kafka-findings-queue';
import { KafkaJobQueue } from './kafka-job-queue';
import { NullFindingsQueue } from './null-findings-queue';
import { NullJobQueue } from './null-job-queue';

const certFolder =
  process.env.FM_ENVIRONMENT === FM_ENVIRONMENTS.tests &&
  process.env.TEST_TYPE === 'unit'
    ? './'
    : '/certs';

export const kafkaConfig: KafkaConfig = {
  clientId: orchestratorConstants.clientId,
  brokers: orchestratorConstants.brokers,
  ssl: {
    rejectUnauthorized: true,
    requestCert: true,
    ca: [readFileSync(`${certFolder}/kafka-ca.crt`, 'utf-8')],
    cert: readFileSync(`${certFolder}/kafka-client-signed.crt`, 'utf-8'),
    key: readFileSync(`${certFolder}/kafka-client.key`, 'utf-8'),
    passphrase: process.env.FM_KAFKA_KEY_PASSWORD,
  },
};

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: JobQueue,
      useFactory: async () => {
        if (process.env.FM_ENVIRONMENT === FM_ENVIRONMENTS.tests)
          return new NullJobQueue();

        const kafka = new Kafka(kafkaConfig);

        const producer = kafka.producer();
        await producer.connect();

        return new KafkaJobQueue(producer);
      },
    },
    {
      provide: FindingsQueue,
      useFactory: async () => {
        if (process.env.FM_ENVIRONMENT === FM_ENVIRONMENTS.tests)
          return new NullFindingsQueue();

        const kafka = new Kafka(kafkaConfig);

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
