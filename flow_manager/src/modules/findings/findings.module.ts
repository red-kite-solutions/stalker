import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Kafka } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { JobsModule } from '../database/jobs/jobs.module';
import { CompanyModule } from '../database/reporting/company.module';
import { HostModule } from '../database/reporting/host/host.module';
import { SubscriptionsModule } from '../database/subscriptions/subscriptions.module';
import { FindingsHandlers } from './commands/findings-commands';
import { FindingsService } from './findings.service';

@Module({
  imports: [
    CqrsModule,
    JobsModule,
    CompanyModule,
    HostModule,
    SubscriptionsModule,
  ],
  controllers: [],
  providers: [FindingsService, ...FindingsHandlers],
  exports: [],
})
export class FindingsModule {
  private logger: Logger = new Logger('FindingsModule');

  public constructor(private findingsService: FindingsService) {}

  public async onApplicationBootstrap() {
    if (!process.env.TESTS) {
      const kafka = new Kafka({
        clientId: 'flow-manager',
        brokers: [process.env['KAFKA_URI']],
      });

      const consumer = kafka.consumer({ groupId: 'flow-manager' });
      await consumer.connect();
      await consumer.subscribe({
        topic: orchestratorConstants.topics.findings,
        fromBeginning: false,
      });

      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.logger.debug('Kafka message found!');
          try {
            const findingsRaw = JSON.parse(message.value.toString());
            if (findingsRaw.JobId) {
              const findings = {
                jobId: findingsRaw.JobId,
                findings: JSON.parse(findingsRaw.FindingsJson).findings,
              };
              this.logger.debug(
                `Kafka findings for Job ID ${findings.jobId} : ${JSON.stringify(
                  findings.findings,
                )}`,
              );
              this.findingsService.handleJobFindings(findings);
            } else {
              const findings = {
                findings: JSON.parse(findingsRaw.FindingsJson).findings,
              };
              this.logger.debug(
                `Kafka findings (no Job ID) : ${JSON.stringify(
                  findings.findings,
                )}`,
              );
              this.findingsService.handleFindings(findings);
            }
          } catch (err) {
            this.logger.error(
              'Error while reading Kafka message : ' +
                err +
                '\nMessage content: ' +
                message.value.toString(),
            );
          }
        },
      });
    }
  }
}
