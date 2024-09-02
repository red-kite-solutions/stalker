import { Kafka, KafkaMessage } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { FindingsService } from './findings.service';
import { KafkaConsumer } from './kafka.consumer';

export class FindingsConsumer extends KafkaConsumer {
  protected get groupId(): string {
    return 'jobs-manager';
  }

  protected get topic(): string {
    return orchestratorConstants.topics.findings;
  }

  protected get fromBeginning(): boolean {
    return true;
  }

  protected constructor(
    kafka: Kafka,
    private findingsService: FindingsService,
  ) {
    super(kafka);
  }

  protected async consume(message: KafkaMessage) {
    const findingsRaw = JSON.parse(message.value.toString());
    if (findingsRaw.JobId) {
      const findings = {
        jobId: findingsRaw.JobId,
        timestamp: findingsRaw.Timestamp,
        findings: JSON.parse(findingsRaw.FindingsJson).findings,
      };
      this.logger.debug(`Kafka findings for Job ID ${findings.jobId}`);
      for (const finding of findings.findings) {
        const findingCopy = JSON.parse(JSON.stringify(finding));
        if (findingCopy.fields && Array.isArray(findingCopy.fields)) {
          for (const field of findingCopy.fields) {
            if (field.type && field.type === 'image' && field.data) {
              field.data = '_removed_image_data_for_printing_';
            }
          }
        }
        this.logger.debug(
          `Finding for Job ID ${findings.jobId} : ${JSON.stringify(
            findingCopy,
          )}`,
        );
      }
      this.findingsService.handleJobFindings(findings);
    } else {
      const findings = {
        findings: JSON.parse(findingsRaw.FindingsJson).findings,
      };
      this.logger.debug(
        `Kafka findings (no Job ID) : ${JSON.stringify(findings.findings)}`,
      );
      this.findingsService.handleFindings(findings);
    }
  }

  public static async create(kafka: Kafka, findingsService: FindingsService) {
    const consumer = new FindingsConsumer(kafka, findingsService);
    await consumer.start();
    return consumer;
  }
}
