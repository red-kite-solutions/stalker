import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SearchTerms } from '@red-kite/jobs-manager/common-duplicates/search-query';
import { FilterQuery, Model, Types } from 'mongoose';
import { Tag } from '../../tags/tag.model';

import {
  cidrStringToipv4Range,
  ipv4RangeToMinMax,
} from '../../../../utils/ip-address.utils';
import { isIpRange } from '../../../../validators/is-ip-range.validator';
import { Domain } from '../domain/domain.model';
import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { Port } from '../port/port.model';
import { Project } from '../project.model';
import { Host, HostDocument } from './host.model';

@Injectable()
export class HostsFilterParser extends FilterParserBase<HostDocument> {
  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('port') private readonly portsModel: Model<Port>,
    @InjectModel('domain') private readonly domainModel: Model<Domain>,
    @InjectModel('project') projectModel: Model<Project>,
    @InjectModel('tags') tagModel: Model<Tag>,
  ) {
    super(projectModel, tagModel);
  }

  protected async buildResourceFilters(terms: SearchTerms) {
    return [
      ...this.idFilters(terms),
      ...this.ipFilters(terms),
      ...this.domainFilters(terms),
    ];
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

    // Ips
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'host.ip');
        const ranges = t
          .filter((x) => isIpRange(x.value))
          .map((x) => ipv4RangeToMinMax(cidrStringToipv4Range(x.value)));
        const ips = t.filter((x) => !isIpRange(x));

        if (t.length) {
          filters.push({
            $or: [
              { ip: { $in: this.toInclusionList(ips) } },
              ...ranges.map((r) => ({
                ipInt: {
                  $gte: r.min,
                  $lte: r.max,
                },
              })),
            ],
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'host.ip');
        const ranges = t
          .filter((x) => isIpRange(x.value))
          .map((x) => ipv4RangeToMinMax(cidrStringToipv4Range(x.value)));
        const ips = t.filter((x) => !isIpRange(x.value));

        if (t.length) {
          filters.push({
            $and: [
              { ip: { $not: { $in: this.toInclusionList(ips) } } },
              ...ranges.map((r) => ({
                ipInt: {
                  $not: {
                    $gte: r.min,
                    $lte: r.max,
                  },
                },
              })),
            ],
          });
        }
      }
    }

    return filters;
  }

  /** Handles "domain.id" search terms. */
  private domainFilters(terms: SearchTerms) {
    const filters: FilterQuery<HostDocument>[] = [];

    // "domain.name" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'domain.name');
        const names = this.toInclusionList(t);
        if (t.length) {
          filters.push({
            'domains.name': { $in: names },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'domain.name');
        if (t.length) {
          const names = this.toInclusionList(t);
          filters.push({
            'domains.name': { $not: { $in: names } },
          });
        }
      }
    }

    // "domain.id" filters
    {
      // Inclusion
      {
        const t = this.consumeTerms(terms, '', 'domain.id');
        if (t.length) {
          const ids = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ 'domains.id': { $in: ids } });
        }
      }

      // Exclusion
      {
        const t = this.consumeTerms(terms, '-', 'domain.id');
        if (t.length) {
          const ids = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ 'domains.id': { $not: { $in: ids } } });
        }
      }
    }

    return filters;
  }
}
