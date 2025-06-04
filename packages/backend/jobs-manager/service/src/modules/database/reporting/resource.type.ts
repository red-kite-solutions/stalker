import { DomainDocument } from './domain/domain.model';
import { HostDocument } from './host/host.model';
import { IpRangeDocument } from './ip-ranges/ip-range.model';
import { PortDocument } from './port/port.model';
import { WebsiteDocument } from './websites/website.model';

export const resourceTypes = ['domain', 'host', 'port', 'website'] as const;
export type ResourceType = (typeof resourceTypes)[number];

export type Resource =
  | HostDocument
  | PortDocument
  | DomainDocument
  | IpRangeDocument
  | WebsiteDocument;
