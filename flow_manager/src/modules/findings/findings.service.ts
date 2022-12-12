import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { HttpBadRequestException } from '../../exceptions/http.exceptions';
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
  constructor(
    private commandBus: CommandBus,
    @InjectModel('finding')
    private readonly findingModel: Model<Finding>,
  ) {}

  public async getAll(
    target: string,
    page: number,
    pageSize: number,
  ): Promise<Page<Finding>> {
    if (page < 1) throw new HttpBadRequestException('Page starts at 1.');

    const filters: FilterQuery<Finding> = {
      target: {
        $eq: target,
      },
    };
    const items = await this.findingModel
      .find(filters)
      .sort({
        created: 'desc',
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    const totalRecords = await this.findingModel.countDocuments(filters);

    return {
      items,
      totalRecords,
    };
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
