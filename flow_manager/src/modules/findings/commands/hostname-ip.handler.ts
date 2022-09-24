import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from 'src/modules/database/jobs/jobs.service';
import { Job } from 'src/modules/database/jobs/models/jobs.model';
import { CompanyService } from 'src/modules/database/reporting/company.service';
import { FindingHandlerBase } from './findings-handler-base';
import { HostnameIpCommand } from './hostname-ip.command';

@CommandHandler(HostnameIpCommand)
export class HostnameIpHandler extends FindingHandlerBase<HostnameIpCommand> {
  constructor(jobService: JobsService, private companyService: CompanyService) {
    super(jobService);
  }

  protected async executeCore(job: Job, command: HostnameIpCommand) {
    const company = await this.companyService.get(job.companyId);
    const ipRanges = company.ipRanges ?? [];
    ipRanges.push(...command.ips);

    company.ipRanges = Array.from(new Set(ipRanges));
    await this.companyService.update(company.id, company);

    const updatedCompany = await this.companyService.get(job.companyId);
    console.log(updatedCompany);
  }
}
