import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../../database/jobs/jobs.service';
import { HostService } from '../../../database/reporting/host/host.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { HostnameIpCommand } from './hostname-ip.command';

@CommandHandler(HostnameIpCommand)
export class HostnameIpHandler extends JobFindingHandlerBase<HostnameIpCommand> {
  protected logger: Logger = new Logger('HostnameIpHandler');

  constructor(
    private hostService: HostService,
    jobService: JobsService,
    subscriptionsService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
  ) {
    super(
      jobService,
      subscriptionsService,
      customJobsService,
      configService,
      subscriptionTriggersService,
    );
  }

  protected async executeCore(command: HostnameIpCommand) {
    await this.hostService.addHostsWithDomain(
      [command.finding.ip],
      command.finding.domainName,
      command.companyId,
    );
  }
}
