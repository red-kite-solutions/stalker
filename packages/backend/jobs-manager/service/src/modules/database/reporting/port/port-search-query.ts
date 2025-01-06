import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SearchQueryParser,
  SearchTerm,
  SearchTerms,
  TermTypes,
} from '@red-kite/jobs-manager/common-duplicates/search-query';
import { isIP } from 'class-validator';
import { ObjectId } from 'mongodb';
import { FilterQuery, Model, Types } from 'mongoose';
import { BadRequestError } from 'passport-headerapikey';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { TagsService } from '../../tags/tag.service';
import { Host } from '../host/host.model';
import { Project } from '../project.model';
import { WebsiteService } from '../websites/website.service';
import { Port } from './port.model';

@Injectable()
export class PortSearchQuery {
  private queryParser = new SearchQueryParser();

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('project') private readonly projectModel: Model<Project>,
    private tagsService: TagsService,
    @InjectModel('port') private readonly portsModel: Model<Port>,
    private readonly websiteService: WebsiteService,
  ) {}

  public async toMongoFilters(query: string): Promise<FilterQuery<Port>> {
    const terms = this.queryParser.parse(query, {
      completeTermsOnly: true,
      excludeEmptyValues: true,
    });

    if (!terms.length) return {};

    this.ensureTerms(terms);

    console.log('-----------------------');
    console.log(terms);

    const finalFilter: FilterQuery<Port> = { $and: [] };

    // "is" filters
    {
      const t = this.consumeTerms(terms, '', 'is', 'blocked');
      if (t.length) {
        finalFilter.$and.push({ blocked: { $eq: true } });
      }
    }

    {
      const t = this.consumeTerms(terms, '-', 'is', 'blocked');
      if (t.length) {
        finalFilter.$and.push({ blocked: { $not: { $eq: true } } });
      }
    }

    // "host.id" filters
    {
      const t = this.consumeTerms(terms, '', 'host.id');
      if (t.length) {
        const hosts = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({ 'host.id': { $in: hosts } });
      }
    }

    // "-host.id" filters
    {
      const t = this.consumeTerms(terms, '-', 'host.id');
      if (t.length) {
        const notHosts = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({ 'host.id': { $not: { $in: notHosts } } });
      }
    }

    // "host.ip" filters
    {
      const t = this.consumeTerms(terms, '', 'host.ip');
      if (t.length) {
        const hosts = await this.hostModel.find(
          { ip: { $in: this.toInclusionList(t) } },
          '_id',
        );

        finalFilter.$and.push({ 'host.id': { $in: hosts.map((h) => h._id) } });
      }
    }

    // "-host.ip" filters
    {
      const t = this.consumeTerms(terms, '-', 'host.ip');
      if (t.length) {
        const hosts = await this.hostModel.find(
          { ip: { $in: this.toInclusionList(t) } },
          '_id',
        );

        finalFilter.$and.push({
          'host.id': { $not: { $in: hosts.map((h) => h._id) } },
        });
      }
    }

    // "project.id" filters
    {
      const t = this.consumeTerms(terms, '', 'project.id');
      if (t.length) {
        const projects = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({ projectId: { $in: projects } });
      }
    }

    // "-project.id" filters
    {
      const t = this.consumeTerms(terms, '-', 'project.id');
      if (t.length) {
        const projects = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({ projectId: { $not: { $in: projects } } });
      }
    }

    // "project.name" filters
    {
      const t = this.consumeTerms(terms, '', 'project.name');
      if (t.length) {
        const projects = await this.projectModel.find(
          { name: { $in: this.toInclusionList(t) } },
          '_id',
        );

        finalFilter.$and.push({
          projectId: { $in: projects.map((h) => h._id) },
        });
      }
    }

    // "-project.name" filters
    {
      const t = this.consumeTerms(terms, '-', 'project.name');
      if (t.length) {
        console.log(this.toInclusionList(t));
        const projects = await this.projectModel.find(
          { name: { $in: this.toInclusionList(t) } },
          '_id',
        );

        finalFilter.$and.push({
          projectId: { $not: { $in: projects.map((h) => h._id) } },
        });
      }
    }

    // // Filter by tag
    // if (dto.tags) {
    //   const preppedTagsArray = dto.tags
    //     .filter((x) => x)
    //     .map((x) => x.toLowerCase())
    //     .map((x) => new Types.ObjectId(x));

    //   if (preppedTagsArray.length > 0) {
    //     finalFilter['tags'] = {
    //       $all: preppedTagsArray.map((t) => new Types.ObjectId(t)),
    //     };
    //   }
    // }

    // // Filter by createdAt
    // if (dto.firstSeenStartDate || dto.firstSeenEndDate) {
    //   let createdAtFilter = {};

    //   if (dto.firstSeenStartDate && dto.firstSeenEndDate) {
    //     createdAtFilter = [
    //       { createdAt: { $gte: dto.firstSeenStartDate } },
    //       { createdAt: { $lte: dto.firstSeenEndDate } },
    //     ];
    //     finalFilter['$and'] = createdAtFilter;
    //   } else {
    //     if (dto.firstSeenStartDate)
    //       createdAtFilter = { $gte: dto.firstSeenStartDate };
    //     else if (dto.firstSeenEndDate)
    //       createdAtFilter = { $lte: dto.firstSeenEndDate };
    //     finalFilter['createdAt'] = createdAtFilter;
    //   }
    // }

    // // Filter by port
    // if (dto.ports) {
    //   const validPorts = dto.ports.filter((x) => x);
    //   finalFilter['port'] = { $in: validPorts };
    // }

    // // Filter by protocol
    // if (dto.protocol) {
    //   finalFilter['layer4Protocol'] = { $eq: dto.protocol };
    // }

    // // Filter by blocked
    // if (dto.blocked === false) {
    //   finalFilter['$or'] = [
    //     { blocked: { $exists: false } },
    //     { blocked: { $eq: false } },
    //   ];
    // } else if (dto.blocked === true) {
    //   finalFilter['blocked'] = { $eq: true };
    // }

    if (terms.length) {
      throw new BadRequestError(
        `Some search terms were not handled: ${JSON.stringify(terms)}`,
      );
    }

    console.log(JSON.stringify(finalFilter, null, 2));

    return finalFilter;
  }

  private consumeTerms(
    terms: SearchTerms,
    not: '-' | '',
    type: TermTypes,
    value?: string,
  ) {
    const selected = [];

    for (let i = 0; i < terms.length; ) {
      const term = terms[i];
      if (
        term.type === type &&
        (not === '-') === term.not &&
        (value == null || term.value === value)
      ) {
        selected.push(terms[i]);
        terms.splice(i, 1);
      } else {
        i++;
      }
    }

    return selected;
  }

  private ensureTerms(terms: SearchTerms): void {
    for (const term of terms) {
      switch (term.type) {
        case 'is':
          return this.ensureAllowedValues(term, ['blocked']);

        case 'domain.id':
        case 'tag.id':
        case 'host.id':
        case 'port.id':
        case 'project.id':
          return this.ensureObjectId(term);

        case 'port.number':
          return this.ensureNumber(term);

        case 'host.ip':
          return this.ensureIp(term);

        case 'port.protocol':
          return this.ensureAllowedValues(term, ['utc', 'tcp']);

        case 'finding':
          return this.ensureAllowedValues(term, ['exists']);

        case 'domain.name':
        case 'tag.name':
        case 'project.name':
        case 'findingField':
          // No validation required
          return;

        default:
          throw new BadRequestError(
            `${(term as any)?.type} filter not allowed.`,
          );
      }
    }
  }

  private ensureAllowedValues(
    { value, type }: SearchTerm,
    allowedValues: string[],
  ) {
    if (allowedValues.includes(value)) return;

    throw new BadRequestError(`Value ${value} not allowed for ${type} filter.`);
  }

  private ensureObjectId({ value, type }: SearchTerm) {
    if (ObjectId.isValid(value)) return;

    throw new BadRequestError(
      `Value should be an ObjectId for ${type} filter.`,
    );
  }

  private ensureNumber({ value, type }: SearchTerm) {
    if (!Number.isNaN(value)) return;

    throw new BadRequestError(`Value should be a number for ${type} filter.`);
  }

  private ensureIp({ value, type }: SearchTerm) {
    if (isIP(value, 4)) return;

    throw new BadRequestError(
      `Value should be a valid IP address for ${type} filter, but got "${value}".`,
    );
  }

  private toInclusionList(terms: SearchTerm[]): (string | RegExp)[] {
    const values = terms.map((x) => x.value).map((x) => x.trim());
    if (values.some((x) => x[x.length - 1] === '*')) {
      return values
        .map((x) => escapeStringRegexp(x))
        .map(
          (x) =>
            new RegExp(
              `^${x.substring(0, x.length - 2)}${
                x[x.length - 1] === '*' ? '.*' : x[x.length - 1]
              }`,
            ),
        );
    } else {
      return values;
    }
  }
}
