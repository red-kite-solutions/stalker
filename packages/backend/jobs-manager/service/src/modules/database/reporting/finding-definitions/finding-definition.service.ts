import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { Finding } from '../../../findings/findings.service';
import { ConfigService } from '../../admin/config/config.service';
import { FindingDefinitionFilterDto } from './finding-definition.dto';
import {
  FindingDefinition,
  FindingDefinitionDocument,
  FindingFieldDefinition,
} from './finding-definition.model';

@Injectable()
export class FindingDefinitionService {
  private logger = new Logger(FindingDefinitionService.name);
  private readonly updateBufferTimeMs = 5000;
  private readonly updateBufferSize = 500;
  private readonly fieldUpdateBuffer: Record<
    string,
    FindingFieldDefinition & { findingKey: string }
  > = {};
  private updateBufferTimeoutId: NodeJS.Timeout;

  constructor(
    @InjectModel('findingdefinition')
    private readonly findingDefinitionModel: Model<FindingDefinition>,
    private configService: ConfigService,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: FindingDefinitionFilterDto = null,
  ): Promise<FindingDefinitionDocument[]> {
    let query: Query<
      FindingDefinitionDocument[],
      FindingDefinitionDocument,
      any,
      FindingDefinition
    >;
    if (filter) {
      query = this.findingDefinitionModel.find(this.buildFilters(filter));
      if (filter.sort) {
        query = query.sort({ updatedAt: filter.sort });
      }
    } else {
      query = this.findingDefinitionModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public buildFilters(dto: FindingDefinitionFilterDto) {
    const finalFilter = {};
    // Filter by key
    if (dto.keys && dto.keys.length > 0) {
      if (dto.keys.length > 1) {
        finalFilter['key'] = {
          $in: dto.keys,
        };
      } else {
        finalFilter['key'] = {
          $eq: dto.keys[0],
        };
      }
    }

    return finalFilter;
  }

  public async count(filter = null) {
    if (!filter) {
      return await this.findingDefinitionModel.estimatedDocumentCount();
    } else {
      return await this.findingDefinitionModel.countDocuments(
        this.buildFilters(filter),
      );
    }
  }

  private async processFindingDefinitionBuffer() {
    const findings: Record<
      string,
      Pick<FindingDefinition, 'key' | 'fields'>
    > = {};
    for (const key of Object.keys(this.fieldUpdateBuffer)) {
      const data = this.fieldUpdateBuffer[key];
      delete this.fieldUpdateBuffer[key];
      const existingFinding = findings[data.findingKey];
      const ffds: FindingFieldDefinition[] = data.key
        ? [
            {
              key: data.key,
              label: data.label,
              type: data.type,
            },
          ]
        : [];
      if (existingFinding) {
        findings[data.findingKey].fields.push(...ffds);
      } else {
        findings[data.findingKey] = {
          key: data.findingKey,
          fields: ffds,
        };
      }
    }

    for (const key of Object.keys(findings)) {
      await this.updateFindingDefinitionModel(key, findings[key].fields);
    }
  }

  private async updateFindingDefinitionModel(
    key: string,
    fields: FindingFieldDefinition[],
  ) {
    return await this.findingDefinitionModel.updateOne(
      { key: { $eq: key } },
      {
        $set: {
          key: key,
        },
        $addToSet: {
          fields: { $each: fields },
        },
      },
      { upsert: true },
    );
  }

  /**
   * Creates or updates a finding definition from the finding keys.
   * This method buffers the calls to the database to prevent unnecessary load.
   * @param finding The finding for which to create or update the finding definition
   * @param bufferSize Max size of the buffer for this single call. Default value is recommended.
   * @param bufferTimeMs Buffer time for this single call. Default value is recommended.
   * @returns
   */
  public async upsertFindingDefinitionBuffered(
    finding: Pick<Finding, 'key' | 'fields'>,
    bufferSize = this.updateBufferSize,
    bufferTimeMs = this.updateBufferTimeMs,
  ) {
    if (!finding) return;

    if (finding.fields && finding.fields.length >= 1) {
      for (const field of finding.fields) {
        const bufferKey = `${finding.key}:::${field.key}`;
        if (field.type === 'image') {
          this.fieldUpdateBuffer[bufferKey] = {
            key: field.key,
            label: undefined,
            type: field.type,
            findingKey: finding.key,
          };
        } else {
          this.fieldUpdateBuffer[bufferKey] = {
            key: field.key,
            label: field.label,
            type: field.type,
            findingKey: finding.key,
          };
        }
      }
    } else {
      // Add a finding with no fields
      this.fieldUpdateBuffer[finding.key] = {
        key: undefined,
        label: undefined,
        type: undefined,
        findingKey: finding.key,
      };
    }

    if (Object.keys(this.fieldUpdateBuffer).length >= bufferSize) {
      clearTimeout(this.updateBufferTimeoutId);
      this.updateBufferTimeoutId = undefined;
      await this.processFindingDefinitionBuffer();
      return;
    }

    if (!this.updateBufferTimeoutId) {
      this.updateBufferTimeoutId = setTimeout(
        () => this.processFindingDefinitionBuffer(),
        bufferTimeMs,
      );
    }
  }

  /**
   * Creates or updates a finding definition from the finding keys
   * @param finding The finding for which to create or update the finding definition
   * @returns
   */
  public async upsertFindingDefinition(
    finding: Pick<Finding, 'key' | 'fields'>,
  ) {
    if (!finding) return;

    const fieldDefs: FindingFieldDefinition[] = [];
    if (finding.fields) {
      for (const field of finding.fields) {
        if (field.type === 'image') {
          fieldDefs.push({
            key: field.key,
            label: undefined,
            type: field.type,
          });
        } else {
          fieldDefs.push({
            key: field.key,
            label: field.label,
            type: field.type,
          });
        }
      }
    }

    return await this.updateFindingDefinitionModel(finding.key, fieldDefs);
  }

  /**
   * Deletes all the finding definitions older than `config.findingRetentionTimeSeconds`.
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
    await this.findingDefinitionModel.deleteMany({
      createdAt: { $lte: oldestValidCreationDate },
    });
  }
}
