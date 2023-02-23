import { Kafka, KafkaMessage } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { FindingsService } from './findings.service';
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

  protected constructor(
    kafka: Kafka,
    private findingsService: FindingsService,
  ) {
    super(kafka);
  }

  protected async consume(message: KafkaMessage) {
    const findingsRaw = JSON.parse(message.value.toString());
    this.logger.debug(findingsRaw);
    // if (findingsRaw.JobId) {
    //   const findings = {
    //     jobId: findingsRaw.JobId,
    //     timestamp: findingsRaw.Timestamp,
    //     findings: JSON.parse(findingsRaw.FindingsJson).findings,
    //   };
    //   this.logger.debug(
    //     `Kafka findings for Job ID ${findings.jobId} : ${JSON.stringify(
    //       findings.findings,
    //     )}`,
    //   );
    //   this.findingsService.handleJobFindings(findings);
    // } else {
    //   const findings = {
    //     findings: JSON.parse(findingsRaw.FindingsJson).findings,
    //   };
    //   this.logger.debug(
    //     `Kafka findings (no Job ID) : ${JSON.stringify(findings.findings)}`,
    //   );
    //   this.findingsService.handleFindings(findings);
    // }
  }

  public static async create(kafka: Kafka, findingsService: FindingsService) {
    const consumer = new JobLogsConsumer(kafka, findingsService);
    await consumer.start();
    return consumer;
  }
}
