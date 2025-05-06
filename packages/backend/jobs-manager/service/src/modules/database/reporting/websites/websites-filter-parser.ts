import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SearchTerms } from '@red-kite/jobs-manager/common-duplicates/search-query';
import { FilterQuery, Model, Types } from 'mongoose';
import { Tag } from '../../tags/tag.model';
import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { Project } from '../project.model';
import { WebsiteDocument } from './website.model';

@Injectable()
export class WebsitesFilterParser extends FilterParserBase<WebsiteDocument> {
  constructor(
    @InjectModel('project') projectModel: Model<Project>,
    @InjectModel('tags') tagModel: Model<Tag>,
  ) {
    super(projectModel, tagModel);
  }

  protected async buildResourceFilters(terms: SearchTerms) {
    return [
      ...(await this.idFilters(terms)),
      ...(await this.domainFilters(terms)),
      ...(await this.hostFilters(terms)),
      ...(await this.portFilters(terms)),
      ...(await this.isMergedFilters(terms)),
      ...(await this.mergedInIdFilters(terms)),
    ];
  }

  /** Handles "website.id" search terms. */
  private async idFilters(terms: SearchTerms) {
    const filters: FilterQuery<WebsiteDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'website.id');
      if (t.length) {
        const websiteIds = t.map((x) => new Types.ObjectId(x.value));
        filters.push({
          _id: { $in: websiteIds },
        });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'website.id');
      if (t.length) {
        const websiteIds = t.map((x) => new Types.ObjectId(x.value));
        filters.push({
          _id: { $not: { $in: websiteIds } },
        });
      }
    }

    return filters;
  }

  /** Handles "domain.id" search terms. */
  private async domainFilters(terms: SearchTerms) {
    const filters: FilterQuery<WebsiteDocument>[] = [];

    // "domain.name" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'domain.name');
        const names = this.toInclusionList(t);
        if (t.length) {
          filters.push({
            'domain.name': { $in: names },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'domain.name');
        if (t.length) {
          const names = this.toInclusionList(t);
          filters.push({
            'domain.name': { $not: { $in: names } },
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
          filters.push({ 'domain.id': { $in: ids } });
        }
      }

      // Exclusion
      {
        const t = this.consumeTerms(terms, '-', 'domain.id');
        if (t.length) {
          const ids = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ 'domain.id': { $not: { $in: ids } } });
        }
      }
    }

    return filters;
  }

  /** Handles "host.id" and "host.ip" search terms. */
  private async hostFilters(terms: SearchTerms) {
    const filters: FilterQuery<WebsiteDocument>[] = [];

    // "host.id" filters
    {
      // Inclusion
      {
        const t = this.consumeTerms(terms, '', 'host.id');
        if (t.length) {
          const hosts = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ 'host.id': { $in: hosts } });
        }
      }

      // Exclusion
      {
        const t = this.consumeTerms(terms, '-', 'host.id');
        if (t.length) {
          const notHosts = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ 'host.id': { $not: { $in: notHosts } } });
        }
      }
    }

    // "host.ip" filters
    {
      // Inclusion
      {
        const t = this.consumeTerms(terms, '', 'host.ip');
        const ips = this.toInclusionList(t);

        if (t.length) {
          filters.push({ 'host.ip': { $in: ips } });
        }
      }

      // Exclusion
      {
        const t = this.consumeTerms(terms, '-', 'host.ip');
        const ips = this.toInclusionList(t);

        if (t.length) {
          filters.push({ 'host.ip': { $not: { $in: ips } } });
        }
      }
    }

    return filters;
  }

  /** Handles "port.id" and "port.number" search terms. */
  private async portFilters(terms: SearchTerms) {
    const filters: FilterQuery<WebsiteDocument>[] = [];

    // "port.id" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'port.id');
        if (t.length) {
          const portIds = t.map((x) => new Types.ObjectId(x.value));
          filters.push({
            _id: { $in: portIds },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'port.id');
        if (t.length) {
          const portIds = t.map((x) => new Types.ObjectId(x.value));
          filters.push({
            _id: { $not: { $in: portIds } },
          });
        }
      }
    }

    // "port.number" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'port.number');
        const ports = t.map((x) => +x.value);
        if (t.length) {
          filters.push({
            port: { $in: ports },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'port.number');
        if (t.length) {
          const ports = t.map((x) => +x.value);

          filters.push({
            port: { $not: { $in: ports } },
          });
        }
      }
    }

    return filters;
  }

  /** Creates inclusion and exclusion filters for "is: merged" */
  private isMergedFilters(terms: SearchTerms) {
    const filters: FilterQuery<WebsiteDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'is', 'merged');
      if (t.length) {
        filters.push({ mergedInId: { $ne: null } });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'is', 'merged');
      if (t.length) {
        filters.push({ mergedInId: null });
      }
    }

    return filters;
  }

  /** Creates inclusion and exclusion filters for "mergedIn.id" */
  private mergedInIdFilters(terms: SearchTerms) {
    const filters: FilterQuery<WebsiteDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'mergedIn.id');
      if (t.length) {
        const mergedInIds = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ mergedInId: { $in: mergedInIds } });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'mergedIn.id');
      if (t.length) {
        const mergedInIds = t.map((x) => new Types.ObjectId(x.value));
        filters.push({ mergedInId: { $not: { $in: mergedInIds } } });
      }
    }

    return filters;
  }
}
