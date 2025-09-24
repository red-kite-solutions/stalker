import { Injectable } from '@angular/core';
import { DomainsService } from '../../api/domains/domains.service';
import { HostsService } from '../../api/hosts/hosts.service';
import { PortsService } from '../../api/ports/ports.service';
import { WebsitesService } from '../../api/websites/websites.service';
import { Resource, ResourceType } from '../../shared/types/resources.type';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class ResourcesServiceFactory {
  constructor(
    private domainsService: DomainsService,
    private hostsService: HostsService,
    private portsService: PortsService,
    private websitesService: WebsitesService
  ) {}

  public create(resource: ResourceType): ResourceService<Resource> {
    switch (resource) {
      case 'domain':
        return this.domainsService;

      case 'host':
        return this.hostsService;

      case 'port':
        return this.portsService;

      case 'website':
        return this.websitesService;

      default:
        throw new Error(`Unknown resource ${resource}`);
    }
  }
}
