import { Module } from '@nestjs/common';
import { ConfigModelModule } from './admin/config/config-model.module';
import { databaseConfigInitProvider } from './admin/config/config.provider';
import { JobPodConfigModelModule } from './admin/config/job-pod-config/job-pod-config-model.module';
import { AlarmModelModule } from './alarm/alarm-model.module';
import { ApiKeyModelModule } from './api-key/api-key-model.module';
import { JobContainerModelModule } from './container/job-container-model.module';
import { CustomJobTemplateModelModule } from './custom-job-templates/custom-job-templates-model.module';
import { JobModelModule } from './jobs/job-model.module';
import { DomainModelModule } from './reporting/domain/domain-model.module';
import { FindingDefinitionsModelModule } from './reporting/finding-definitions/finding-definition-model.module';
import { FindingModelModule } from './reporting/findings/findings-model.module';
import { HostModelModule } from './reporting/host/host-model.module';
import { PortModelModule } from './reporting/port/port-model.module';
import { ProjectModelModule } from './reporting/project-model.module';
import { WebsiteModelModule } from './reporting/websites/website-model.module';
import { SecretsModelModule } from './secrets/secrets-model.module';
import { CronSubscriptionModelModule } from './subscriptions/cron-subscriptions/cron-subscription-model.module';
import { EventSubscriptionModelModule } from './subscriptions/event-subscriptions/event-subscription-model.module';
import { TagModelModule } from './tags/tag-model.module';
import { UserModelModule } from './users/users-model.module';
import { ViewModelModule } from './views/views-model.module';

@Module({
  imports: [
    HostModelModule,
    JobModelModule,
    ConfigModelModule,
    TagModelModule,
    ProjectModelModule,
    DomainModelModule,
    FindingModelModule,
    PortModelModule,
    JobPodConfigModelModule,
    CronSubscriptionModelModule,
    EventSubscriptionModelModule,
    SecretsModelModule,
    AlarmModelModule,
    CustomJobTemplateModelModule,
    WebsiteModelModule,
    ApiKeyModelModule,
    UserModelModule,
    JobContainerModelModule,
    FindingDefinitionsModelModule,
    ViewModelModule,
  ],
  providers: [...databaseConfigInitProvider],
  exports: [
    ...databaseConfigInitProvider,
    HostModelModule,
    ConfigModelModule,
    JobModelModule,
    TagModelModule,
    ProjectModelModule,
    FindingModelModule,
    PortModelModule,
    JobPodConfigModelModule,
    CronSubscriptionModelModule,
    EventSubscriptionModelModule,
    SecretsModelModule,
    AlarmModelModule,
    CustomJobTemplateModelModule,
    WebsiteModelModule,
    DomainModelModule,
    ApiKeyModelModule,
    JobContainerModelModule,
    FindingDefinitionsModelModule,
    ViewModelModule,
  ],
})
export class DatalayerModule {}
