import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { BadRequestError } from 'passport-headerapikey';
import { Tag } from '../../tags/tag.model';
import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { SearchTermsValidator } from '../filters-parser/search-terms-validator';
import { Host } from '../host/host.model';
import { Project } from '../project.model';
import { Port, PortDocument } from './port.model';

@Injectable()
export class PortsFilterParser extends FilterParserBase {
  private validator = new SearchTermsValidator();

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('project') private readonly projectModel: Model<Project>,
    @InjectModel('tags') private readonly tagModel: Model<Tag>,
    @InjectModel('port') private readonly portsModel: Model<Port>,
  ) {
    super();
  }

  public async buildFilter(
    query: string,
    firstSeenStartDate: number,
    firstSeenEndDate: number,
  ): Promise<FilterQuery<PortDocument>> {
    const terms = this.queryParser.parse(query || '', {
      completeTermsOnly: true,
      excludeEmptyValues: true,
    });

    if (!terms.length) return {};

    this.validator.ensureTerms(terms);

    const finalFilter: FilterQuery<PortDocument> = { $and: [] };

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

        finalFilter.$and.push({ 'host.id': { $in: hosts.map((x) => x._id) } });
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
          'host.id': { $not: { $in: hosts.map((x) => x._id) } },
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
          projectId: { $in: projects.map((x) => x._id) },
        });
      }
    }

    // "-project.name" filters
    {
      const t = this.consumeTerms(terms, '-', 'project.name');
      if (t.length) {
        const projects = await this.projectModel.find(
          { name: { $in: this.toInclusionList(t) } },
          '_id',
        );

        finalFilter.$and.push({
          projectId: { $not: { $in: projects.map((x) => x._id) } },
        });
      }
    }

    // "tag.name" filters
    {
      const t = this.consumeTerms(terms, '', 'tag.name');
      if (t.length) {
        const tags = await this.tagModel.find({
          text: { $in: this.toInclusionList(t, { lowercase: true }) },
        });

        finalFilter.$and.push({
          tags: { $all: tags.map((x) => x._id) },
        });
      }
    }

    // "-tag.name" filters
    {
      const t = this.consumeTerms(terms, '-', 'tag.name');
      if (t.length) {
        const tags = await this.tagModel.find(
          { text: { $in: this.toInclusionList(t, { lowercase: true }) } },
          '_id',
        );

        finalFilter.$and.push({
          tags: { $nin: tags.map((x) => x._id) },
        });
      }
    }

    // "tag.id" filters
    {
      const t = this.consumeTerms(terms, '', 'tag.id');
      if (t.length) {
        const tagIds = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({
          tags: { $all: tagIds },
        });
      }
    }

    // "-tag.id" filters
    {
      const t = this.consumeTerms(terms, '-', 'tag.id');
      if (t.length) {
        const tagIds = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({
          tags: { $nin: tagIds },
        });
      }
    }

    // "port.number" filters
    {
      const t = this.consumeTerms(terms, '', 'port.number');
      const ports = t.map((x) => +x.value);
      if (t.length) {
        finalFilter.$and.push({
          port: { $in: ports },
        });
      }
    }

    // "-port.number" filters
    {
      const t = this.consumeTerms(terms, '-', 'port.number');
      if (t.length) {
        const ports = t.map((x) => +x.value);

        finalFilter.$and.push({
          port: { $not: { $in: ports } },
        });
      }
    }

    // "port.id" filters
    {
      const t = this.consumeTerms(terms, '', 'port.id');
      if (t.length) {
        const portIds = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({
          _id: { $in: portIds },
        });
      }
    }

    // "-port.id" filters
    {
      const t = this.consumeTerms(terms, '-', 'port.id');
      if (t.length) {
        const portIds = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({
          _id: { $not: { $in: portIds } },
        });
      }
    }

    // "port.protocol" filters
    {
      const t = this.consumeTerms(terms, '', 'port.protocol');
      if (t.length) {
        const protocols = this.toInclusionList(t, { lowercase: true });
        finalFilter.$and.push({
          layer4Protocol: { $in: protocols },
        });
      }
    }

    // "-port.protocol" filters
    {
      const t = this.consumeTerms(terms, '-', 'port.protocol');
      if (t.length) {
        const protocols = this.toInclusionList(t, { lowercase: true });
        finalFilter.$and.push({
          layer4Protocol: { $not: { $in: protocols } },
        });
      }
    }

    // "is: blocked" filter
    {
      const t = this.consumeTerms(terms, '', 'is', 'blocked');
      if (t.length) {
        finalFilter.$and.push({ blocked: true });
      }
    }

    // "-is: blocked" filter
    {
      const t = this.consumeTerms(terms, '-', 'is', 'blocked');
      if (t.length) {
        finalFilter.$and.push({ $not: { blocked: true } });
      }
    }

    // Filter by createdAt
    if (firstSeenStartDate) {
      finalFilter.$and.push({ createdAt: { $gte: firstSeenStartDate } });
    }

    if (firstSeenEndDate) {
      finalFilter.$and.push({ createdAt: { $lt: firstSeenEndDate } });
    }

    if (terms.length) {
      throw new BadRequestError(
        `Some search terms were not handled: ${JSON.stringify(terms)}`,
      );
    }

    return finalFilter;
  }
}
