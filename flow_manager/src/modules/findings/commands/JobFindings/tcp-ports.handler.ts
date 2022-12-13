import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from '../../../database/jobs/jobs.service';
import { HostService } from '../../../database/reporting/host/host.service';
import { SubscriptionsService } from '../../../database/subscriptions/subscriptions.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { TcpPortsCommand } from './tcp-ports.command';

@CommandHandler(TcpPortsCommand)
export class TcpPortsHandler extends JobFindingHandlerBase<TcpPortsCommand> {
  protected logger: Logger = new Logger('TcpPortsHandler');

  constructor(
    private hostService: HostService,
    jobService: JobsService,
    subscriptionsService: SubscriptionsService,
  ) {
    super(jobService, subscriptionsService);
  }

  protected async executeCore(command: TcpPortsCommand) {
    await this.hostService.addPortsByIp(
      command.companyId,
      command.ip,
      command.ports,
    );
  }
}
