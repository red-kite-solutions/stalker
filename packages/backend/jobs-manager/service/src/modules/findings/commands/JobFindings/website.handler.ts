import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../../database/jobs/jobs.service';
import { WebsiteService } from '../../../database/reporting/websites/website.service';
import { SecretsService } from '../../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { WebsiteCommand } from './website.command';

@CommandHandler(WebsiteCommand)
export class WebsiteHandler extends JobFindingHandlerBase<WebsiteCommand> {
  protected logger: Logger = new Logger('WebsiteHandler');

  constructor(
    private websiteService: WebsiteService,
    jobService: JobsService,
    subscriptionsService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
    secretsService: SecretsService,
  ) {
    super(
      jobService,
      subscriptionsService,
      customJobsService,
      configService,
      subscriptionTriggersService,
      secretsService,
    );
  }

  protected async executeCore(command: WebsiteCommand) {
    console.log(command.finding);
    await this.websiteService.addWebsite(
      command.projectId,
      command.finding.ip,
      command.finding.port,
      command.finding.domain,
      command.finding.path,
      command.finding.ssl || command.finding.ssl === false
        ? command.finding.ssl
        : undefined,
    );
  }
}
