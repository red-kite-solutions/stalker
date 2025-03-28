import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SearchTerms } from '@red-kite/jobs-manager/common-duplicates/search-query';
import { FilterQuery, Model, Types } from 'mongoose';
import { Tag } from '../../tags/tag.model';
import { FilterParserBase } from '../filters-parser/filter-parser-base';
import { Host } from '../host/host.model';
import { Project } from '../project.model';
import { Port, PortDocument } from './port.model';

@Injectable()
export class PortsFilterParser extends FilterParserBase<PortDocument> {
  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('port') private readonly portsModel: Model<Port>,
    @InjectModel('project') projectModel: Model<Project>,
    @InjectModel('tags') tagModel: Model<Tag>,
  ) {
    super(projectModel, tagModel);
  }

  protected async buildResourceFilters(terms: SearchTerms) {
    return [
      ...(await this.idFilters(terms)),
      ...(await this.numberFilters(terms)),
      ...(await this.protocolFilters(terms)),
      ...(await this.serviceFilters(terms)),
      ...(await this.versionFilters(terms)),
      ...(await this.productFilters(terms)),
      ...(await this.idFilters(terms)),
      ...(await this.hostFilters(terms)),
    ];
  }

  /** Handles "port.id" search terms. */
  private async idFilters(terms: SearchTerms) {
    const filters: FilterQuery<PortDocument>[] = [];

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

    return filters;
  }

  /** Handles "port.number" search terms. */
  private async numberFilters(terms: SearchTerms) {
    const filters: FilterQuery<PortDocument>[] = [];

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

    return filters;
  }

  /** Handles "port.protocol" search terms. */
  private async protocolFilters(terms: SearchTerms) {
    const filters: FilterQuery<PortDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'port.protocol');
      if (t.length) {
        const protocols = this.toInclusionList(t, { lowercase: true });
        filters.push({
          layer4Protocol: { $in: protocols },
        });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'port.protocol');
      if (t.length) {
        const protocols = this.toInclusionList(t, { lowercase: true });
        filters.push({
          layer4Protocol: { $not: { $in: protocols } },
        });
      }
    }

    return filters;
  }

  /** Handles "port.service" search terms. */
  private async serviceFilters(terms: SearchTerms) {
    const filters: FilterQuery<PortDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'port.service');
      if (t.length) {
        const service = this.toInclusionList(t, { lowercase: true });
        filters.push({
          service: { $in: service },
        });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'port.service');
      if (t.length) {
        const services = this.toInclusionList(t, { lowercase: true });
        filters.push({
          service: { $not: { $in: services } },
        });
      }
    }

    return filters;
  }

  /** Handles "port.version" search terms. */
  private async versionFilters(terms: SearchTerms) {
    const filters: FilterQuery<PortDocument>[] = [];

    // Include
    {
      const t = this.consumeTerms(terms, '', 'port.version');
      if (t.length) {
        const version = this.toInclusionList(t, { lowercase: true });
        filters.push({
          service: { $in: version },
        });
      }
    }

    // Exclude
    {
      const t = this.consumeTerms(terms, '-', 'port.version');
      if (t.length) {
        const version = this.toInclusionList(t, { lowercase: true });
        filters.push({
          version: { $not: { $in: version } },
        });
      }
    }

    return filters;
  }

  /** Handles "port.product" search terms. */
  private async productFilters(terms: SearchTerms) {
    const filters: FilterQuery<PortDocument>[] = [];

    // "port.product" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'port.product');
        if (t.length) {
          const product = this.toInclusionList(t, { lowercase: true });
          filters.push({
            product: { $in: product },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'port.product');
        if (t.length) {
          const product = this.toInclusionList(t, { lowercase: true });
          filters.push({
            product: { $not: { $in: product } },
          });
        }
      }
    }

    return filters;
  }

  /** Handles "host.id" and "host.ip" search terms. */
  private async hostFilters(terms: SearchTerms) {
    const filters: FilterQuery<PortDocument>[] = [];

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
        if (t.length) {
          const hosts = await this.hostModel.find(
            { ip: { $in: this.toInclusionList(t) } },
            '_id',
          );

          filters.push({ 'host.id': { $in: hosts.map((x) => x._id) } });
        }
      }

      // Exclusion
      {
        const t = this.consumeTerms(terms, '-', 'host.ip');
        if (t.length) {
          const hosts = await this.hostModel.find(
            { ip: { $in: this.toInclusionList(t) } },
            '_id',
          );

          filters.push({
            'host.id': { $not: { $in: hosts.map((x) => x._id) } },
          });
        }
      }
    }

    return filters;
  }
}
