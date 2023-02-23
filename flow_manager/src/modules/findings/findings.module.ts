import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Kafka } from 'kafkajs';
import { CustomJobsModule } from '../database/custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../database/datalayer.module';
import { JobsModule } from '../database/jobs/jobs.module';
import { CompanyModule } from '../database/reporting/company.module';
import { HostModule } from '../database/reporting/host/host.module';
import { SubscriptionsModule } from '../database/subscriptions/subscriptions.module';
import { FindingsHandlers } from './commands/findings-commands';
import { FindingsConsumer } from './findings.consumer';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';
import { JobLogsConsumer } from './job-logs.consumer';

@Module({
  imports: [
    CqrsModule,
    JobsModule,
    CompanyModule,
    HostModule,
    DatalayerModule,
    SubscriptionsModule,
    CustomJobsModule,
  ],
  controllers: [FindingsController],
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

      await FindingsConsumer.create(kafka, this.findingsService);
      await JobLogsConsumer.create(kafka, this.findingsService);
    }
  }
}
