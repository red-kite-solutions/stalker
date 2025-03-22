import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobExecutionsService } from '../../../database/jobs/job-executions.service';
import { CorrelationKeyUtils } from '../../../database/reporting/correlation.utils';
import { DomainsService } from '../../../database/reporting/domain/domain.service';
import { HostService } from '../../../database/reporting/host/host.service';
import { IpRangeService } from '../../../database/reporting/ip-ranges/ip-range.service';
import { PortService } from '../../../database/reporting/port/port.service';
import { WebsiteService } from '../../../database/reporting/websites/website.service';
import { SecretsService } from '../../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { TagsService } from '../../../database/tags/tag.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { TagCommand } from './tag.command';

@CommandHandler(TagCommand)
export class TagHandler extends JobFindingHandlerBase<TagCommand> {
  protected logger: Logger = new Logger('TagHandler');

  constructor(
    private domainService: DomainsService,
    private hostService: HostService,
    private portService: PortService,
    private tagService: TagsService,
    private websiteService: WebsiteService,
    private ipRangeService: IpRangeService,
    jobService: JobExecutionsService,
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

  protected async executeCore(command: TagCommand) {
    const tag = await this.tagService.getByText(command.finding.tag);
    if (!tag) return;

    const service = CorrelationKeyUtils.getResourceServiceName(
      command.finding.correlationKey,
    );

    switch (service) {
      case 'DomainsService':
        await this.domainService.tagDomainByName(
          command.finding.domainName,
          command.projectId,
          tag._id.toString(),
          true,
        );
        break;

      case 'HostService':
        await this.hostService.tagHostByIp(
          command.finding.ip,
          command.projectId,
          tag._id.toString(),
          true,
        );
        break;

      case 'PortService':
        await this.portService.tagPortByIp(
          command.finding.ip,
          command.finding.port,
          command.finding.protocol,
          command.projectId,
          tag._id.toString(),
          true,
        );
        break;

      case 'WebsiteService':
        await this.websiteService.tagWebsiteByCorrelationKey(
          command.finding.correlationKey,
          tag._id.toString(),
          true,
        );
        break;

      case 'IpRangeService':
        await this.ipRangeService.tagIpRangeByIp(
          command.finding.ip,
          command.finding.mask,
          command.projectId,
          tag._id.toString(),
          true,
        );
        break;

      default:
        break;
    }
  }
}
