import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../exceptions/http.exceptions';
import { Page } from '../../types/page.type';
import { ProjectUnassigned } from '../../validators/is-project-id.validator';
import { JobsService } from '../database/jobs/jobs.service';
import { CorrelationKeyUtils } from '../database/reporting/correlation.utils';
import { CustomFinding } from '../database/reporting/findings/finding.model';
import { ProjectService } from '../database/reporting/project.service';
import { HostnameCommand } from './commands/Findings/hostname.command';
import { IpCommand } from './commands/Findings/ip.command';
import { IpRangeCommand } from './commands/Findings/ipRange.command';
import { CustomFindingCommand } from './commands/JobFindings/custom.command';
import { HostnameIpCommand } from './commands/JobFindings/hostname-ip.command';
import { PortCommand } from './commands/JobFindings/port.command';
import { TagCommand } from './commands/JobFindings/tag.command';
import { CustomFindingFieldDto } from './finding.dto';

export type Finding =
  | HostnameIpFinding
  | HostnameFinding
  | IpFinding
  | IpRangeFinding
  | PortFinding
  | JobStatusFinding
  | CreateCustomFinding
  | TagFinding;

export class FindingBase {
  jobId?: string;
  correlationKey?: string;
  fields?: CustomFindingFieldDto[];
}

export class PortFinding extends FindingBase {
  type: 'PortFinding';
  key: 'PortFinding';
  ip: string;
  port: number;
  declare fields: [
    {
      type: 'text';
      key: 'protocol';
      data: 'tcp' | 'udp';
      label: string;
    },
  ];
}

export class ResourceFinding extends FindingBase {
  domainName?: string;
  ip?: string;
  port?: number;
  protocol?: 'tcp' | 'udp';
}

export class CreateCustomFinding extends ResourceFinding {
  type: 'CustomFinding';
  key: string;
  name: string;
}

export class TagFinding extends ResourceFinding {
  type: 'TagFinding';
  key: 'TagFinding';
  tag: string;
}

export class JobStatusFinding extends FindingBase {
  type: 'JobStatusFinding';
  key: 'JobStatusFinding';
  status: string;
}

export class HostnameFinding extends FindingBase {
  type: 'HostnameFinding';
  key: 'HostnameFinding';
  projectId: string;
  domainName: string;
}

export class IpFinding extends FindingBase {
  type: 'IpFinding';
  key: 'IpFinding';
  projectId: string;
  ip: string;
}

export class IpRangeFinding extends FindingBase {
  type: 'IpRangeFinding';
  key: 'IpRangeFinding';
  projectId: string;
  ip: string;
  mask: number; // ex: 24
}

export class HostnameIpFinding extends FindingBase {
  type: 'HostnameIpFinding';
  key: 'HostnameIpFinding';
  domainName: string;
  ip: string;
}

export interface Findings {
  findings: Finding[];
}

export interface JobFindings extends Findings {
  jobId: string;
  timestamp: number;
}

@Injectable()
export class FindingsService {
  private logger = new Logger(FindingsService.name);

  constructor(
    private commandBus: CommandBus,
    private jobsService: JobsService,
    private projectService: ProjectService,
    @InjectModel('finding')
    private readonly findingModel: Model<CustomFinding>,
  ) {}

  public async getAll(
    target: string,
    page: number,
    pageSize: number,
  ): Promise<Page<CustomFinding>> {
    if (page < 1) throw new HttpBadRequestException('Page starts at 1.');

    const filters: FilterQuery<CustomFinding> = {};

    if (target) {
      filters.correlationKey = {
        $eq: target,
      };
    }

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

  /**
   * Saves the given finding.
   */
  public async save(
    projectId: string,
    jobId: string = null,
    dto: CreateCustomFinding,
  ) {
    if (projectId !== undefined) {
      const project = await this.projectService.get(projectId);
      if (project === null) {
        throw new HttpNotFoundException(
          `The project for the given job does not exist (jobId=${jobId}, projectId=${projectId})`,
        );
      }
    } else {
      projectId = ProjectUnassigned;
    }

    const job = await this.jobsService.getById(jobId);
    if (job === null) {
      throw new HttpNotFoundException(
        `The given job does not exist (jobId=${jobId})`,
      );
    }

    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      dto.domainName,
      dto.ip,
      dto.port,
      dto.protocol,
    );

    const finding: CustomFinding = {
      correlationKey,
      jobId,
      created: new Date(),
      fields: dto.fields,
      name: dto.name,
      key: dto.key,
    };

    await this.findingModel.create(finding);
  }

  /**
   * Handles findings that WERE found by a job
   * @param findings
   */
  public handleJobFindings(findings: JobFindings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding, findings.timestamp, findings.jobId).catch(
        (e) => this.logger.error(e),
      );
    }
  }

  /**
   * Handles findings that were NOT found by a job
   * This function generates its own finding timestamp as the finding was created by
   * the jobs manager anyway
   * @param findings
   */
  public handleFindings(findings: Findings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding, Date.now());
    }
  }

  private async handleFinding(
    finding: Finding,
    timestamp: number,
    jobId: string = '',
  ) {
    let projectId = '';
    if (jobId) {
      const job = await this.jobsService.getById(jobId);
      if (job === null) {
        this.logger.error(`The given job does not exist (jobId=${jobId})`);
        return;
      }
      finding.jobId = jobId;

      if (job.projectId !== undefined) {
        const project = await this.projectService.get(job.projectId);
        if (project === null) {
          this.logger.error(
            `The project for the given job does not exist (jobId=${jobId}, projectId=${job.projectId})`,
          );
          return;
        }
        projectId = project._id.toString();
      } else {
        projectId = ProjectUnassigned;
      }
      if (finding.type !== 'JobStatusFinding') {
        await this.jobsService.addJobOutputLine(
          jobId,
          timestamp,
          JSON.stringify(finding),
          'info',
        );
      } else {
        // If it was only a status update, no need to do the whole findings' logic
        if (!finding.status || typeof finding.status !== 'string') {
          this.logger.error(
            `Ignoring job status update. Got status: ${finding.status}`,
          );
          return;
        }

        this.jobsService.updateJobStatus(jobId, finding.status, timestamp);
        return;
      }
    }

    if (projectId === ProjectUnassigned) {
      // Skipping the findings management if it was not assigned to any project,
      // as the job was run as a one time thing. The output will be fetched by
      // the front-end and will be shown to the user.
      return;
    }

    switch (finding.type) {
      case 'HostnameIpFinding':
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          projectId,
          null,
          finding.ip,
        );
        this.commandBus.execute(
          new HostnameIpCommand(
            jobId,
            projectId,
            HostnameIpCommand.name,
            finding,
          ),
        );
        break;
      case 'HostnameFinding':
        finding.projectId = finding.projectId ? finding.projectId : projectId;
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          finding.projectId,
          finding.domainName,
        );
        this.commandBus.execute(
          new HostnameCommand(finding.projectId, HostnameCommand.name, finding),
        );
        break;

      case 'IpFinding':
        finding.projectId = finding.projectId ? finding.projectId : projectId;
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          finding.projectId,
          null,
          finding.ip,
        );
        this.commandBus.execute(
          new IpCommand(finding.projectId, IpCommand.name, finding),
        );
        break;

      case 'IpRangeFinding':
        finding.projectId = finding.projectId ? finding.projectId : projectId;
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          finding.projectId,
          null,
          finding.ip,
          null,
          null,
          finding.mask,
        );
        this.commandBus.execute(
          new IpRangeCommand(finding.projectId, IpRangeCommand.name, finding),
        );
        break;

      case 'PortFinding':
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          projectId,
          null,
          finding.ip,
          finding.port,
          finding.fields[0]?.data,
        );
        this.commandBus.execute(
          new PortCommand(jobId, projectId, PortCommand.name, finding),
        );
        break;

      case 'CustomFinding':
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          projectId,
          finding.domainName,
          finding.ip,
          finding.port,
          finding.protocol,
        );
        this.commandBus.execute(
          new CustomFindingCommand(
            jobId,
            projectId,
            CustomFindingCommand.name,
            finding,
          ),
        );
        break;

      case 'TagFinding':
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          projectId,
          finding.domainName,
          finding.ip,
          finding.port,
          finding.protocol,
        );
        this.commandBus.execute(
          new TagCommand(jobId, projectId, CustomFindingCommand.name, finding),
        );
      default:
        this.logger.error(`Unknown finding type ${finding['type']}`);
    }
  }
}
