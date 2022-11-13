import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from '../../database/jobs/jobs.service';
import { Job } from '../../database/jobs/models/jobs.model';
import { Company } from '../../database/reporting/company.model';
import { CompanyService } from '../../database/reporting/company.service';
import { HostService } from '../../database/reporting/host/host.service';
import { HostnameIpCommand } from './hostname-ip.command';
import { JobFindingHandlerBase } from './job-findings-handler-base';

@CommandHandler(HostnameIpCommand)
export class HostnameIpHandler extends JobFindingHandlerBase<HostnameIpCommand> {
  protected logger: Logger = new Logger('HostnameIpHandler');

  constructor(
    private hostService: HostService,
    jobService: JobsService,
    companyService: CompanyService,
  ) {
    super(jobService, companyService);
  }

  protected async executeCore(
    job: Job,
    company: Company,
    command: HostnameIpCommand,
  ) {
    await this.hostService.addHostsWithDomain(
      command.ips,
      command.domainName,
      job.companyId,
      company.name,
    );
  }
}
