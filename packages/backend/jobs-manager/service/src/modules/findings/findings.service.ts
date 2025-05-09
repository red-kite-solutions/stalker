import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Document, FilterQuery, Model } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../exceptions/http.exceptions';
import { Page } from '../../types/page.type';
import { ProjectUnassigned } from '../../validators/is-project-id.validator';
import { ConfigService } from '../database/admin/config/config.service';
import { JobExecutionsService } from '../database/jobs/job-executions.service';
import { CorrelationKeyUtils } from '../database/reporting/correlation.utils';
import { FindingDefinitionService } from '../database/reporting/finding-definitions/finding-definition.service';
import { CustomFinding } from '../database/reporting/findings/finding.model';
import { ProjectService } from '../database/reporting/project.service';
import { HostnameCommand } from './commands/Findings/hostname.command';
import { IpRangeCommand } from './commands/Findings/ip-range.command';
import { IpCommand } from './commands/Findings/ip.command';
import { CustomFindingCommand } from './commands/JobFindings/custom.command';
import { HostnameIpCommand } from './commands/JobFindings/hostname-ip.command';
import { PortCommand } from './commands/JobFindings/port.command';
import { TagCommand } from './commands/JobFindings/tag.command';
import { WebsiteCommand } from './commands/JobFindings/website.command';
import { CustomFindingFieldDto, FindingsFilterDto } from './finding.dto';

export type Finding =
  | HostnameIpFinding
  | HostnameFinding
  | HostnameBatchFinding
  | IpFinding
  | IpBatchFinding
  | IpRangeFinding
  | IpRangeBatchFinding
  | PortFinding
  | PortBatchFinding
  | WebsiteFinding
  | WebsiteBatchFinding
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

export class PortBatchFinding extends FindingBase {
  type: 'PortBatchFinding';
  key: 'PortBatchFinding';
  ipBatch: string[];
  portBatch: number[];
  protocolBatch: ('tcp' | 'udp')[];

  constructor() {
    super();
    this.ipBatch = [];
    this.portBatch = [];
    this.protocolBatch = [];
  }
}

export class ResourceFinding extends FindingBase {
  domainName?: string;
  ip?: string;
  mask?: number;
  port?: number;
  protocol?: 'tcp' | 'udp';
  path?: string;
}

export class WebsiteFinding extends ResourceFinding {
  type: 'WebsiteFinding';
  key: 'WebsiteFinding';
  path: string = '/';
  ssl?: boolean;
  protocol: 'tcp' = 'tcp';
}

export class WebsiteBatchFinding extends FindingBase {
  type: 'WebsiteBatchFinding';
  key: 'WebsiteBatchFinding';
  sslBatch: boolean[];
  pathBatch: string[];
  ipBatch: string[];
  protocolBatch: 'tcp'[];
  portBatch: number[];
  domainBatch: string[];

  constructor() {
    super();
    this.domainBatch = [];
    this.ipBatch = [];
    this.portBatch = [];
    this.protocolBatch = [];
    this.pathBatch = [];
    this.sslBatch = [];
  }
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

export class HostnameBatchFinding extends FindingBase {
  type: 'HostnameBatchFinding';
  key: 'HostnameBatchFinding';
  projectId: string;
  domainBatch: string[];

  constructor() {
    super();
    this.domainBatch = [];
  }
}

export class IpFinding extends FindingBase {
  type: 'IpFinding';
  key: 'IpFinding';
  projectId: string;
  ip: string;
}

export class IpBatchFinding extends FindingBase {
  type: 'IpBatchFinding';
  key: 'IpBatchFinding';
  projectId: string;
  ipBatch: string[];

  constructor() {
    super();
    this.ipBatch = [];
  }
}

export class IpRangeFinding extends FindingBase {
  type: 'IpRangeFinding';
  key: 'IpRangeFinding';
  projectId: string;
  ip: string;
  mask: number; // ex: 24
}

export class IpRangeBatchFinding extends FindingBase {
  type: 'IpRangeBatchFinding';
  key: 'IpRangeBatchFinding';
  projectId: string;
  ipBatch: string[];
  maskBatch: number[]; // ex: 24

  constructor() {
    super();
    this.ipBatch = [];
    this.maskBatch = [];
  }
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
    private jobsService: JobExecutionsService,
    private projectService: ProjectService,
    private configService: ConfigService,
    @InjectModel('finding')
    private readonly findingModel: Model<CustomFinding>,
    private readonly findingDefinitionService: FindingDefinitionService,
  ) {}

  /**
   * Deletes all the findings runs older than `config.findingRetentionTimeSeconds`.
   */
  public async cleanup(
    now: number = Date.now(),
    ttlMilliseconds: number | undefined = undefined,
  ): Promise<void> {
    if (ttlMilliseconds === undefined) {
      const config = await this.configService.getConfig();
      ttlMilliseconds = config.findingRetentionTimeSeconds * 1000;
    }

    const oldestValidCreationDate = now - ttlMilliseconds;
    await this.findingModel.deleteMany({
      created: { $lte: new Date(oldestValidCreationDate) },
    });
  }

  public async getAll(
    page: number,
    pageSize: number,
    dto: FindingsFilterDto = undefined,
  ): Promise<Page<CustomFinding & Document>> {
    if (page < 0) throw new HttpBadRequestException('Page starts at 0.');

    return await this.getAllFindings(
      this.buildFilters(dto),
      !!dto.latestOnly,
      page,
      pageSize,
    );
  }

  private async getAllFindings(
    filters: FilterQuery<CustomFinding>,
    latestOnly: boolean,
    page: number,
    pageSize: number,
  ): Promise<Page<CustomFinding & Document>> {
    if (!latestOnly) {
      const items = await this.findingModel
        .find(filters)
        .sort({
          created: 'desc',
        })
        .skip(page * pageSize)
        .limit(pageSize)
        .exec();
      const totalRecords = await this.findingModel.countDocuments(filters);
      return {
        items,
        totalRecords,
      };
    }

    return (
      // This query returns only the latest finding by key for every resource,
      // in the page format with the count
      (
        await this.findingModel.aggregate<Page<CustomFinding & Document>>(
          [
            { $sort: { created: -1 } },
            {
              $match: filters,
            },
            {
              $group: {
                _id: {
                  key: '$key',
                  correlationKey: '$correlationKey',
                },
                name: { $first: '$name' },
                fields: { $first: '$fields' },
                id: { $first: '$_id' },
                created: { $first: '$created' },
              },
            },
            {
              $group: {
                _id: '$_id.key',
                data: {
                  $addToSet: {
                    _id: '$id',
                    key: '$_id.key',
                    correlationKey: '$_id.correlationKey',
                    name: '$name',
                    fields: '$fields',
                    created: '$created',
                  },
                },
              },
            },
            {
              $unwind: {
                path: '$data',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $facet: {
                counting: [{ $count: 'count' }],
                items: [
                  { $sort: { 'data.created': -1 } },
                  { $skip: page * pageSize },
                  { $limit: pageSize },
                  {
                    $project: {
                      _id: '$data._id',
                      key: '$data.key',
                      correlationKey: '$data.correlationKey',
                      name: '$data.name',
                      fields: '$data.fields',
                      created: '$data.created',
                    },
                  },
                ],
              },
            },
            {
              $project: {
                totalRecords: { $first: '$counting.count' },
                items: '$items',
              },
            },
          ],
          { maxTimeMS: 60000, allowDiskUse: true },
        )
      )[0]
    );
  }

  private buildFilters(dto: FindingsFilterDto): FilterQuery<CustomFinding> {
    const filters: FilterQuery<CustomFinding> = {};
    filters.$and = [];

    if (dto.targets && dto.targets.length > 0) {
      if (dto.targets.length === 1) {
        filters.correlationKey = {
          $eq: dto.targets[0],
        };
      } else {
        filters.correlationKey = {
          $in: dto.targets,
        };
      }
    }

    if (
      dto.findingDenyList?.length ||
      dto.findingAllowList?.length ||
      dto.fieldFilters?.length
    ) {
      if (dto.findingDenyList?.length) {
        filters.$and.push({ key: { $nin: dto.findingDenyList } });
      }

      if (dto.findingAllowList?.length) {
        filters.$and.push({ key: { $in: dto.findingAllowList } });
      }

      if (dto.fieldFilters) {
        for (const fieldFilter of dto.fieldFilters) {
          fieldFilter;
          filters.$and.push({
            fields: {
              $elemMatch: {
                key: fieldFilter.key,
                data: fieldFilter.data,
              },
            },
          });
        }
      }
    }

    if (dto.projects) {
      const correlationKeys = [];
      for (const id of dto.projects) {
        const correlationKey: string =
          CorrelationKeyUtils.generateCorrelationKey(id);
        correlationKeys.push(new RegExp(`${correlationKey}.*`));
      }

      filters.$and.push({ correlationKey: { $in: correlationKeys } });
    }

    if (!filters.$and.length) delete filters.$and;

    return filters;
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
      dto.mask,
      dto.path,
    );

    const finding: CustomFinding = {
      correlationKey,
      jobId,
      created: new Date(),
      fields: dto.fields,
      name: dto.name,
      key: dto.key,
    };

    return await this.findingModel.create(finding);
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

    // No need to wait for update
    await this.findingDefinitionService.upsertFindingDefinitionBuffered(
      finding,
    );

    if (projectId === ProjectUnassigned) {
      // Skipping the findings management if it was not assigned to any project,
      // as the job was run as a one time thing. The output will be fetched by
      // the front-end and will be shown to the user.
      return;
    }

    try {
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
            new HostnameCommand(
              finding.projectId,
              HostnameCommand.name,
              finding,
            ),
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

        case 'TagFinding':
          finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
            projectId,
            finding.domainName,
            finding.ip,
            finding.port,
            finding.protocol,
            finding.mask,
            finding.path,
          );
          this.commandBus.execute(
            new TagCommand(
              jobId,
              projectId,
              CustomFindingCommand.name,
              finding,
            ),
          );
          break;

        case 'WebsiteFinding':
          finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
            projectId,
            finding.domainName ?? '',
            finding.ip,
            finding.port,
            'tcp',
            null,
            finding.path ?? '/',
          );
          this.commandBus.execute(
            new WebsiteCommand(jobId, projectId, WebsiteCommand.name, finding),
          );
          break;

        case 'CustomFinding':
          finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
            projectId,
            finding.domainName,
            finding.ip,
            finding.port,
            finding.protocol,
            null,
            finding.path,
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

        default:
          this.logger.error(`Unknown finding type ${finding['type']}`);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }
}
