import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from 'src/modules/database/jobs/jobs.service';
import { Job } from 'src/modules/database/jobs/models/jobs.model';
import { CompanyService } from 'src/modules/database/reporting/company.service';
import { HostService } from '../../database/reporting/host/host.service';
import { FindingHandlerBase } from './findings-handler-base';
import { HostnameIpCommand } from './hostname-ip.command';

@CommandHandler(HostnameIpCommand)
export class HostnameIpHandler extends FindingHandlerBase<HostnameIpCommand> {
  constructor(
    jobService: JobsService,
    private companyService: CompanyService,
    private hostService: HostService,
  ) {
    super(jobService);
  }

  protected async executeCore(job: Job, command: HostnameIpCommand) {
    const company = await this.companyService.get(job.companyId);
    await this.hostService.addHostsWithDomain(
      command.ips,
      command.domainName,
      job.companyId,
      company.name,
    );
  }
}
