import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JobsService } from '../database/jobs/jobs.service';
import { CompanyService } from '../database/reporting/company.service';
import { HostnameCommand } from './commands/Findings/hostname.command';
import { HostnameIpCommand } from './commands/JobFindings/hostname-ip.command';
import { TcpPortsCommand } from './commands/JobFindings/tcp-ports.command';

export type Finding = HostnameIpFinding | HostnameFinding | TcpPortsFinding;

export interface TcpPortsFinding {
  type: 'TcpPortsFinding';
  ip: string;
  ports: number[];
}

export interface HostnameFinding {
  type: 'HostnameFinding';
  domainName: string;
  companyId: string;
}

export interface HostnameIpFinding {
  type: 'HostnameIpFinding';
  domainName: string;
  ips: string[];
}

export interface Findings {
  findings: Finding[];
}

export interface JobFindings extends Findings {
  jobId: string;
}

@Injectable()
export class FindingsService {
  private logger = new Logger(FindingsService.name);

  constructor(
    private commandBus: CommandBus,
    private jobsService: JobsService,
    private companyService: CompanyService,
  ) {}

  /**
   * Handles findings that WERE found by a job
   * @param findings
   */
  public handleJobFindings(findings: JobFindings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding, findings.jobId);
    }
  }

  /**
   * Handles findings that were NOT found by a job
   * @param findings
   */
  public handleFindings(findings: Findings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding);
    }
  }

  private async handleFinding(finding: Finding, jobId: string = '') {
    let companyId = '';
    if (jobId) {
      const job = await this.jobsService.getById(jobId);
      if (job == null) {
        this.logger.error(`The given job does not exist (jobId=${jobId})`);
        return;
      }

      const company = await this.companyService.get(job.companyId);
      if (company == null) {
        this.logger.error(
          `The company for the given job does not exist (jobId=${jobId}, companyId=${job.companyId})`,
        );
        return;
      }
      companyId = company._id.toString();
    }

    switch (finding.type) {
      case 'HostnameIpFinding':
        this.commandBus.execute(
          new HostnameIpCommand(
            jobId,
            companyId,
            HostnameIpCommand.name,
            finding.domainName,
            finding.ips,
          ),
        );
        break;
      case 'HostnameFinding':
        this.commandBus.execute(
          new HostnameCommand(
            finding.domainName,
            finding.companyId,
            HostnameCommand.name,
          ),
        );
        break;

      case 'TcpPortsFinding':
        this.commandBus.execute(
          new TcpPortsCommand(
            jobId,
            companyId,
            TcpPortsCommand.name,
            finding.ip,
            finding.ports,
          ),
        );
        break;

      default:
        console.log('Unknown finding type');
    }
  }
}
