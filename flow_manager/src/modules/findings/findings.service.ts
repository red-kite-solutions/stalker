import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JobsService } from '../database/jobs/jobs.service';
import { HostnameCommand } from './commands/Findings/hostname.command';
import { HostnameIpCommand } from './commands/JobFindings/hostname-ip.command';
import { TcpPortsCommand } from './commands/JobFindings/tcp-ports.command';

export type Finding = HostnameIpFinding | HostnameFinding | TcpPortsFinding;
export const FindingTypes = [
  'HostnameIpFinding',
  'HostnameFinding',
  'TcpPortsFinding',
];

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
  constructor(private commandBus: CommandBus, jobsService: JobsService) {}

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

  private handleFinding(finding: Finding, jobId: string = '') {
    switch (finding.type) {
      case 'HostnameIpFinding':
        this.commandBus.execute(
          new HostnameIpCommand(jobId, finding.domainName, finding.ips),
        );
        break;
      case 'HostnameFinding':
        this.commandBus.execute(
          new HostnameCommand(finding.domainName, finding.companyId),
        );
        break;

      case 'TcpPortsFinding':
        this.commandBus.execute(
          new TcpPortsCommand(jobId, finding.ip, finding.ports),
        );
        break;

      default:
        console.log('Unknown finding type');
    }
  }
}
