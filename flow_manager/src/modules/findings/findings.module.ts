import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Kafka } from 'kafkajs';
import { orchestratorConstants } from '../auth/constants';
import { JobsModule } from '../database/jobs/jobs.module';
import { CompanyModule } from '../database/reporting/company.module';
import { FindingModelModule } from '../database/reporting/findings/findings-model.module';
import { HostModule } from '../database/reporting/host/host.module';
import { FindingsCommands } from './commands/findings-commands';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';

@Module({
  imports: [
    CqrsModule,
    JobsModule,
    CompanyModule,
    HostModule,
    FindingModelModule,
  ],
  controllers: [FindingsController],
  providers: [FindingsService, ...FindingsCommands],
  exports: [],
})
export class FindingsModule {
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
          const findingsRaw = JSON.parse(message.value.toString());
          const findings = {
            jobId: findingsRaw.JobId,
            findings: JSON.parse(findingsRaw.FindingsJson).findings,
          };

          this.findingsService.handle(findings);
        },
      });
    }
  }
}
