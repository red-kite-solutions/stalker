import { Kafka, KafkaMessage } from 'kafkajs';
import { JobLogLevel } from '../../types/timestamped-string.type';
import { orchestratorConstants } from '../auth/constants';
import { JobExecutionsService } from '../database/jobs/job-executions.service';
import { KafkaConsumer } from './kafka.consumer';

export class JobLogsConsumer extends KafkaConsumer {
  protected get groupId(): string {
    return 'jobs-manager-job-logs';
  }

  protected get topic(): string {
    return orchestratorConstants.topics.jobLogs;
  }

  protected get fromBeginning(): boolean {
    return false;
  }

  protected constructor(
    kafka: Kafka,
    private jobService: JobExecutionsService,
  ) {
    super(kafka);
  }

  protected async consume(message: KafkaMessage) {
    const log = JSON.parse(message.value.toString());
    this.logger.debug(log);

    let level: JobLogLevel = 'debug';
    if (log.LogLevel == 1) level = 'info';
    if (log.LogLevel == 2) level = 'warning';
    if (log.LogLevel == 3) level = 'error';

    await this.jobService.addJobOutputLine(
      log.JobId,
      log.Timestamp,
      log.Log,
      level,
    );
  }

  public static async create(kafka: Kafka, jobService: JobExecutionsService) {
    const consumer = new JobLogsConsumer(kafka, jobService);
    await consumer.start();
    return consumer;
  }
}
