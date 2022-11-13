import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { HostnameIpCommand } from './commands/hostname-ip.command';

type Finding = HostnameIpFinding;

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
  constructor(private commandBus: CommandBus) {}

  public handle(findings: JobFindings) {
    for (const finding of findings.findings) {
      this.handleFinding(findings.jobId, finding);
    }
  }

  private handleFinding(jobId: string, finding: Finding) {
    switch (finding.type) {
      case 'HostnameIpFinding':
        this.commandBus.execute(
          new HostnameIpCommand(jobId, finding.domainName, finding.ips),
        );
        break;

      default:
        console.log('Unknown finding type');
    }
  }
}
