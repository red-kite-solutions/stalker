import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobExecutionsService } from '../../../database/jobs/job-executions.service';
import { DomainsService } from '../../../database/reporting/domain/domain.service';
import { SecretsService } from '../../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { UserFindingHandlerBase } from '../user-findings-handler-base';
import { HostnameCommand } from './hostname.command';

@CommandHandler(HostnameCommand)
export class HostnameHandler extends UserFindingHandlerBase<HostnameCommand> {
  protected logger: Logger = new Logger('HostnameHandler');

  constructor(
    private domainsService: DomainsService,
    jobService: JobExecutionsService,
    subscriptionsService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
    secretsService: SecretsService,
  ) {
    super(
      subscriptionsService,
      jobService,
      customJobsService,
      configService,
      subscriptionTriggersService,
      secretsService,
    );
  }

  protected async executeCore(command: HostnameCommand) {
    if (!command.finding.jobId) return;

    await this.domainsService.addDomain(
      command.finding.domainName,
      command.projectId,
    );
  }
}
