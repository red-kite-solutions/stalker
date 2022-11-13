import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from 'src/modules/database/jobs/jobs.service';
import { FindingHandlerBase } from '../findings-handler-base';
import { HostnameCommand } from './hostname.command';

@CommandHandler(HostnameCommand)
export class HostnameHandler extends FindingHandlerBase<HostnameCommand> {
  protected logger: Logger = new Logger('HostnameHandler');

  constructor(private readonly jobService: JobsService) {
    super();
  }

  protected async executeCore(command: HostnameCommand) {
    // Launch a domain name resolving job
    const job = this.jobService.createDomainResolvingJob(
      command.companyId,
      command.domainName,
    );
    this.jobService.publish(job);
  }
}
