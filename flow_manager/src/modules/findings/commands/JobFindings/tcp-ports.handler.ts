import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from '../../../database/jobs/jobs.service';
import { Job } from '../../../database/jobs/models/jobs.model';
import { CompanyDocument } from '../../../database/reporting/company.model';
import { CompanyService } from '../../../database/reporting/company.service';
import { HostService } from '../../../database/reporting/host/host.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { TcpPortsCommand } from './tcp-ports.command';

@CommandHandler(TcpPortsCommand)
export class TcpPortsHandler extends JobFindingHandlerBase<TcpPortsCommand> {
  protected logger: Logger = new Logger('TcpPortsHandler');

  constructor(
    private hostService: HostService,
    jobService: JobsService,
    companyService: CompanyService,
  ) {
    super(jobService, companyService);
  }

  protected async executeCore(
    job: Job,
    company: CompanyDocument,
    command: TcpPortsCommand,
  ) {
    await this.hostService.addPortsByIp(company._id, command.ip, command.ports);
  }
}
