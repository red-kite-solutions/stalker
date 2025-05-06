import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SearchTerms } from '@red-kite/jobs-manager/common-duplicates/search-query';
import { FilterQuery, Model, Types } from 'mongoose';
import { Tag } from '../../tags/tag.model';

import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { Port } from '../port/port.model';
import { Project } from '../project.model';
import { Host, HostDocument } from './host.model';

@Injectable()
export class HostsFilterParser extends FilterParserBase<HostDocument> {
  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('port') private readonly portsModel: Model<Port>,
    @InjectModel('project') projectModel: Model<Project>,
    @InjectModel('tags') tagModel: Model<Tag>,
  ) {
    super(projectModel, tagModel);
  }

  protected async buildResourceFilters(terms: SearchTerms) {
    return [...this.idFilters(terms), ...this.ipFilters(terms)];

    // TODO #319
    // // if (dto.ranges) {
    // //   const ranges: { min: number; max: number }[] = dto.ranges.map((range) => {
    // //     return ipv4RangeToMinMax(cidrStringToipv4Range(range));
    // //   });
    // //   finalFilter['$and'].push({
    // //     $or: ranges.map((r) => {
    // //       return {
    // //         ipInt: {
    // //           $gte: r.min,
    // //           $lte: r.max,
    // //         },
    // //       };
    // //     }),
    // //   });
    // // }
  }

  /** Handles "host.id" terms. */
  private idFilters(terms: SearchTerms) {
    const filters: FilterQuery<HostDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'host.id');
      if (t.length) {
        const hosts = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ _id: { $in: hosts } });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'host.id');
      if (t.length) {
        const notHosts = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ _id: { $not: { $in: notHosts } } });
      }
    }

    return filters;
  }

  /** Handles "host.ip" terms. */
  private ipFilters(terms: SearchTerms) {
    const filters: FilterQuery<HostDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'host.ip');
      if (t.length) {
        filters.push({ ip: { $in: this.toInclusionList(t) } });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'host.ip');
      if (t.length) {
        filters.push({
          ip: { $not: { $in: this.toInclusionList(t) } },
        });
      }
    }

    return filters;
  }
}
