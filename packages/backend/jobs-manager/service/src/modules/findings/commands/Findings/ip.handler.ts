import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobExecutionsService } from '../../../database/jobs/job-executions.service';
import { HostService } from '../../../database/reporting/host/host.service';
import { SecretsService } from '../../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { UserFindingHandlerBase } from '../user-findings-handler-base';
import { IpCommand } from './ip.command';

@CommandHandler(IpCommand)
export class IpHandler extends UserFindingHandlerBase<IpCommand> {
  protected logger: Logger = new Logger('IpHandler');

  constructor(
    private readonly hostService: HostService,
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

  protected async executeCore(command: IpCommand) {
    if (!command.finding.jobId) return;

    await this.hostService.addHost(command.finding.ip, command.projectId);
  }
}
