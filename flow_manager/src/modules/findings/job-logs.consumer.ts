import { Kafka, KafkaMessage } from 'kafkajs';
import { JobLogLevel } from '../../types/timestamped-string.type';
import { orchestratorConstants } from '../auth/constants';
import { JobsService } from '../database/jobs/jobs.service';
import { KafkaConsumer } from './kafka.consumer';

export class JobLogsConsumer extends KafkaConsumer {
  protected get groupId(): string {
    return 'flow-manager-job-logs';
  }

  protected get topic(): string {
    return orchestratorConstants.topics.jobLogs;
  }

  protected get fromBeginning(): boolean {
    return false;
  }

  protected constructor(kafka: Kafka, private jobService: JobsService) {
    super(kafka);
  }

  protected async consume(message: KafkaMessage) {
    const log = JSON.parse(message.value.toString());
    this.logger.debug(log);

    let level: JobLogLevel = 'debug';
    if (log.LogLevel == 1) level = 'info';
    if (log.LogLevel == 2) level = 'warning';
    if (log.LogLevel == 3) level = 'error';

    this.jobService.addJobOutputLine(log.JobId, log.Timestamp, log.Log, level);
  }

  public static async create(kafka: Kafka, jobService: JobsService) {
    const consumer = new JobLogsConsumer(kafka, jobService);
    await consumer.start();
    return consumer;
  }
}
