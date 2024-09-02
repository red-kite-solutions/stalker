import { Logger, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Kafka } from 'kafkajs';
import { isTest } from '../app.constants';
import { ConfigModule } from '../database/admin/config/config.module';
import { CustomJobsModule } from '../database/custom-jobs/custom-jobs.module';
import { DatalayerModule } from '../database/datalayer.module';
import { JobsModule } from '../database/jobs/jobs.module';
import { JobsService } from '../database/jobs/jobs.service';
import { DomainsModule } from '../database/reporting/domain/domain.module';
import { HostModule } from '../database/reporting/host/host.module';
import { PortModule } from '../database/reporting/port/port.module';
import { ProjectModule } from '../database/reporting/project.module';
import { WebsiteModule } from '../database/reporting/websites/website.module';
import { SecretsModule } from '../database/secrets/secrets.module';
import { EventSubscriptionsModule } from '../database/subscriptions/event-subscriptions/event-subscriptions.module';
import { SubscriptionTriggersModule } from '../database/subscriptions/subscription-triggers/subscription-triggers.module';
import { TagsModule } from '../database/tags/tag.module';
import { kafkaConfig } from '../job-queue/queue.module';
import { FindingsHandlers } from './commands/findings-commands';
import { FindingsConsumer } from './findings.consumer';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';
import { JobLogsConsumer } from './job-logs.consumer';

@Module({
  imports: [
    CqrsModule,
    JobsModule,
    ProjectModule,
    HostModule,
    DomainsModule,
    DatalayerModule,
    EventSubscriptionsModule,
    CustomJobsModule,
    PortModule,
    ConfigModule,
    SubscriptionTriggersModule,
    SecretsModule,
    WebsiteModule,
    TagsModule,
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
    if (!isTest()) {
      const kafka = new Kafka(kafkaConfig);

      await FindingsConsumer.create(kafka, this.findingsService);
      await JobLogsConsumer.create(kafka, this.jobService);
    }
  }
}
