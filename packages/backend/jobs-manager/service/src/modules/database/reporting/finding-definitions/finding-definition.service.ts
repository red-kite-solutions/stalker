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
        // TODO: test the sort
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

  /**
   * Creates or updates a finding definition from the finding keys
   * @param finding The finding for which to create or update the finding definition
   * @returns
   */
  public async upsertFindingDefinition(finding: Finding) {
    if (!finding) return;

    const fieldDefs: FindingFieldDefinition[] = [];
    if (finding.fields) {
      for (const field of finding.fields) {
        if (field.type === 'image') continue;

        fieldDefs.push({
          key: field.key,
          label: field.label,
        });
      }
    }

    return await this.findingDefinitionModel.updateOne(
      { key: { $eq: finding.key } },
      {
        $set: {
          key: finding.key,
        },
        $addToSet: {
          fields: { $each: fieldDefs },
        },
      },
      { upsert: true },
    );
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
