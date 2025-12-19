import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SearchTerms } from '@red-kite/jobs-manager/common-duplicates/search-query';
import { FilterQuery, Model, Types } from 'mongoose';
import { Tag } from '../../tags/tag.model';
import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { Host } from '../host/host.model';
import { Port } from '../port/port.model';
import { Project } from '../project.model';
import { Domain, DomainDocument } from './domain.model';

@Injectable()
export class DomainsFilterParser extends FilterParserBase<DomainDocument> {
  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('port') private readonly portsModel: Model<Port>,
    @InjectModel('domain') private readonly domainsModel: Model<Domain>,
    @InjectModel('project') projectModel: Model<Project>,
    @InjectModel('tags') tagModel: Model<Tag>,
  ) {
    super(projectModel, tagModel);
  }

  public async buildResourceFilters(terms: SearchTerms) {
    return [
      ...this.domainIdFilters(terms),
      ...this.domainNameFilters(terms),
      ...(await this.hostFilters(terms)),
    ];
  }

  /** Handles "domain.id" terms. */
  private domainIdFilters(terms: SearchTerms) {
    const filters: FilterQuery<DomainDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'domain.id');
      if (t.length) {
        const domains = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ _id: { $in: domains } });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'domain.id');
      if (t.length) {
        const notDomains = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ _id: { $not: { $in: notDomains } } });
      }
    }
    return filters;
  }
  /** Handles "domain.name" terms. */
  private domainNameFilters(terms: SearchTerms) {
    const filters: FilterQuery<DomainDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'domain.name');
      if (t.length) {
        const domains = this.toInclusionList(t, { lowercase: true });
        filters.push({ name: { $in: domains } });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'domain.name');
      if (t.length) {
        const notDomains = this.toInclusionList(t, { lowercase: true });
        filters.push({ name: { $not: { $in: notDomains } } });
      }
    }
    return filters;
  }

  /** Handles "host.id" terms. */
  private async hostFilters(terms: SearchTerms) {
    const filters: FilterQuery<DomainDocument>[] = [];

    // "host.id" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'host.id');
        if (t.length) {
          const hosts = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ 'hosts.id': { $in: hosts } });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'host.id');
        if (t.length) {
          const notHosts = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ 'hosts.id': { $not: { $in: notHosts } } });
        }
      }
    }

    // Include
    {
      {
        const t = this.consumeTerms(terms, '', 'host.ip');
        if (t.length) {
          const hosts = await this.hostModel.find(
            { ip: { $in: this.toInclusionList(t) } },
            { _id: 1, domains: 1 },
          );

          filters.push({
            _id: { $in: hosts.map((x) => x.domains.map((d) => d.id)).flat() },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'host.ip');
        if (t.length) {
          const hosts = await this.hostModel.find(
            { ip: { $in: this.toInclusionList(t) } },
            { _id: 1, domains: 1 },
          );

          filters.push({
            _id: {
              $not: {
                $in: hosts.map((x) => x.domains.map((d) => d.id)).flat(),
              },
            },
          });
        }
      }
    }

    return filters;
  }
}
