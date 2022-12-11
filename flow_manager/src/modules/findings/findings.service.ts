import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Page } from '../../types/page.type';
import { Finding } from '../database/reporting/findings/finding.model';
import { HostnameIpCommand } from './commands/hostname-ip.command';

type NewFinding = NewHostnameIpFinding;

export interface NewHostnameIpFinding {
  type: 'HostnameIpFinding';
  domainName: string;
  ips: string[];
}

export interface NewFindings {
  jobId: string;
  findings: NewFinding[];
}

@Injectable()
export class FindingsService {
  constructor(private commandBus: CommandBus) {}

  public async getAll(
    target: string,
    page: number,
    pageSize: number,
  ): Promise<Page<Finding>> {
    return Promise.resolve({
      totalRecords: 5,
      items: [
        {
          created: new Date(2022, 10, 18),
          jobId: '123',
          target: '',
          targetName: '',
          name: 'Screenshot',
          key: '123',
          fields: [
            {
              type: 'text',
              label: 'Some more info',
              content: 'lvl >9999',
            },
            {
              type: 'image',
              data: 'https://themeisle.com/blog/wp-content/uploads/2018/06/browshot_dashboard.png',
            },
          ],
        },
        {
          created: new Date(2022, 9, 18),
          jobId: '123',
          target: '',
          targetName: '',
          name: 'SMTP',
          key: '123',
          fields: [
            {
              type: 'text',
              label: 'Iz dis running SMTP?',
              content: 'yup',
            },
          ],
        },
      ],
    });
  }

  public handle(findings: NewFindings) {
    for (const finding of findings.findings) {
      this.handleFinding(findings.jobId, finding);
    }
  }

  private handleFinding(jobId: string, finding: NewFinding) {
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
