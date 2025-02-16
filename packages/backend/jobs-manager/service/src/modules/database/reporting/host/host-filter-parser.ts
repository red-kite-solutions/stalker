import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { BadRequestError } from 'passport-headerapikey';
import { Tag } from '../../tags/tag.model';
import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { SearchTermsValidator } from '../filters-parser/search-terms-validator';
import { Port } from '../port/port.model';
import { Project } from '../project.model';
import { Host, HostDocument } from './host.model';

@Injectable()
export class HostsFilterParser extends FilterParserBase {
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
  ): Promise<FilterQuery<HostDocument>> {
    const terms = this.queryParser.parse(query || '', {
      completeTermsOnly: true,
      excludeEmptyValues: true,
    });

    if (!terms.length) return {};

    this.validator.ensureTerms(terms);

    const finalFilter: FilterQuery<HostDocument> = { $and: [] };

    // "host.id" filters
    {
      const t = this.consumeTerms(terms, '', 'host.id');
      if (t.length) {
        const hosts = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({ id: { $in: hosts } });
      }
    }

    // "-host.id" filters
    {
      const t = this.consumeTerms(terms, '-', 'host.id');
      if (t.length) {
        const notHosts = t.map((x) => new Types.ObjectId(x.value));
        finalFilter.$and.push({ id: { $not: { $in: notHosts } } });
      }
    }

    console.log(finalFilter);

    // "host.ip" filters
    {
      const t = this.consumeTerms(terms, '', 'host.ip');
      if (t.length) {
        finalFilter.$and.push({ ip: { $in: this.toInclusionList(t) } });
      }
    }

    // "-host.ip" filters
    {
      const t = this.consumeTerms(terms, '-', 'host.ip');
      if (t.length) {
        finalFilter.$and.push({
          ip: { $not: { $in: this.toInclusionList(t) } },
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
        finalFilter.$and.push({ blocked: { $not: { $eq: true } } });
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
