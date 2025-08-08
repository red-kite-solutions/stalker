import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SearchTerms } from '@red-kite/jobs-manager/common-duplicates/search-query';
import { FilterQuery, Model, Types } from 'mongoose';
import { Tag } from '../../tags/tag.model';

import {
  cidrStringToipv4Range,
  ipv4ToNumber,
} from '../../../../utils/ip-address.utils';
import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { Port } from '../port/port.model';
import { Project } from '../project.model';
import { IpRangeDocument } from './ip-range.model';

@Injectable()
export class IpRangeFilterParser extends FilterParserBase<IpRangeDocument> {
  constructor(
    @InjectModel('iprange') private readonly ipRangeModel: Model<Port>,
    @InjectModel('project') projectModel: Model<Project>,
    @InjectModel('tags') tagModel: Model<Tag>,
  ) {
    super(projectModel, tagModel);
  }

  protected async buildResourceFilters(terms: SearchTerms) {
    return [
      ...this.idFilters(terms),
      ...this.cidrFilters(terms),
      ...this.ipFilters(terms),
    ];
  }

  /** Handles "ipRange.id" terms. */
  private idFilters(terms: SearchTerms) {
    const filters: FilterQuery<IpRangeDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'ipRange.id');
      if (t.length) {
        const hosts = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ _id: { $in: hosts } });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'ipRange.id');
      if (t.length) {
        const notHosts = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ _id: { $not: { $in: notHosts } } });
      }
    }

    return filters;
  }

  /** Handles "ipRange.cidr" terms. */
  private cidrFilters(terms: SearchTerms) {
    const filters: FilterQuery<IpRangeDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'ipRange.cidr');
      if (t.length) {
        for (const term of t) {
          const range = cidrStringToipv4Range(term.value);
          filters.push({ ip: range.ip, mask: range.mask });
        }
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'ipRange.cidr');
      if (t.length) {
        for (const term of t) {
          const range = cidrStringToipv4Range(term.value);
          filters.push({ ip: { $ne: range.ip }, mask: { $ne: range.mask } });
        }
      }
    }
    return filters;
  }

  /** Handles "host.ip" terms. */
  private ipFilters(terms: SearchTerms) {
    const filters: FilterQuery<IpRangeDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'host.ip');
      if (t.length) {
        for (const term of t) {
          const ip = ipv4ToNumber(term.value);
          if (!isNaN(ip)) {
            filters.push({
              ipMinInt: { $lte: ip },
              ipMaxInt: { $gte: ip },
            });
          }
        }
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'host.ip');
      if (t.length) {
        for (const term of t) {
          const ip = ipv4ToNumber(term.value);
          if (!isNaN(ip)) {
            filters.push({
              $or: [{ ipMinInt: { $gt: ip } }, { ipMaxInt: { $lt: ip } }],
            });
          }
        }
      }
    }

    return filters;
  }
}
