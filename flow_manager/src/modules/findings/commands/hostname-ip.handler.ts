import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from 'src/modules/database/jobs/jobs.service';
import { Job } from 'src/modules/database/jobs/models/jobs.model';
import { CompanyService } from 'src/modules/database/reporting/company.service';
import { Company } from '../../database/reporting/company.model';
import { HostService } from '../../database/reporting/host/host.service';
import { FindingHandlerBase } from './findings-handler-base';
import { HostnameIpCommand } from './hostname-ip.command';

@CommandHandler(HostnameIpCommand)
export class HostnameIpHandler extends FindingHandlerBase<HostnameIpCommand> {
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
