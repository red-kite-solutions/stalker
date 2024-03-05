import { Module } from '@nestjs/common';
import { Kafka, KafkaConfig } from 'kafkajs';
import { readFileSync } from 'node:fs';
import { FM_ENVIRONMENTS } from '../app.constants';
import { orchestratorConstants } from '../auth/constants';
import { FindingsQueue } from './findings-queue';
import { JobCodeQueue } from './job-code-queue';
import { JobQueue } from './job-queue';
import { KafkaFindingsQueue } from './kafka-findings-queue';
import { KafkaJobCodeQueue } from './kafka-job-code-queue';
import { KafkaJobQueue } from './kafka-job-queue';
import { NullFindingsQueue } from './null-findings-queue';
import { NullJobCodeQueue } from './null-job-code-queue';
import { NullJobQueue } from './null-job-queue';

const certFolder =
  process.env.FM_ENVIRONMENT === FM_ENVIRONMENTS.tests &&
  process.env.TEST_TYPE === 'unit'
    ? './'
    : '/certs';
const certTestExtension =
  process.env.FM_ENVIRONMENT === FM_ENVIRONMENTS.tests &&
  process.env.TEST_TYPE === 'unit'
    ? '.test'
    : '';

export const kafkaConfig: KafkaConfig = {
  clientId: orchestratorConstants.clientId,
  brokers: orchestratorConstants.brokers,
  ssl: {
    rejectUnauthorized: true,
    requestCert: true,
    ca: [
      readFileSync(`${certFolder}/kafka-ca.crt${certTestExtension}`, 'utf-8'),
    ],
    cert: readFileSync(
      `${certFolder}/kafka-client-signed.crt${certTestExtension}`,
      'utf-8',
    ),
    key: readFileSync(
      `${certFolder}/kafka-client.key${certTestExtension}`,
      'utf-8',
    ),
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
    {
      provide: JobCodeQueue,
      useFactory: async () => {
        if (process.env.FM_ENVIRONMENT === FM_ENVIRONMENTS.tests)
          return new NullJobCodeQueue();

        const kafka = new Kafka(kafkaConfig);

        const producer = kafka.producer();
        await producer.connect();

        return new KafkaJobCodeQueue(producer);
      },
    },
  ],
  exports: [JobQueue, FindingsQueue, JobCodeQueue],
})
export class QueueModule {
  public constructor() {}
}
