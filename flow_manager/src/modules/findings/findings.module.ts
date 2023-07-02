import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Kafka } from 'kafkajs';
import { FM_ENVIRONMENTS } from '../app.constants';
import { ConfigModule } from '../database/admin/config/config.module';
import { CustomJobsModule } from '../database/custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../database/datalayer.module';
import { JobsModule } from '../database/jobs/jobs.module';
import { JobsService } from '../database/jobs/jobs.service';
import { CompanyModule } from '../database/reporting/company.module';
import { HostModule } from '../database/reporting/host/host.module';
import { PortModule } from '../database/reporting/port/port.module';
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
    PortModule,
    ConfigModule,
  ],
  controllers: [FindingsController],
  providers: [FindingsService, ...FindingsHandlers],
  exports: [],
})
export class FindingsModule {
  private logger: Logger = new Logger('FindingsModule');

  public constructor(
    private findingsService: FindingsService,
    private jobService: JobsService,
  ) {}

  public async onApplicationBootstrap() {
    if (process.env.FM_ENVIRONMENT !== FM_ENVIRONMENTS.tests) {
      const kafka = new Kafka({
        clientId: 'flow-manager',
        brokers: [process.env['KAFKA_URI']],
      });

      await FindingsConsumer.create(kafka, this.findingsService);
      await JobLogsConsumer.create(kafka, this.jobService);
    }
  }
}
