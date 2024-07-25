import { DomainSummary } from '../domain/domain.summary';
import { HostSummary } from '../host/host.summary';
import { PortSummary } from '../ports/port.summary';

export interface Website {
  _id: string;
  url: string;
  ssl: boolean;
  host: HostSummary;
  domain?: DomainSummary;
  port: PortSummary;
  path: string;
  sitemap: string[];
  previewImage: string;
  projectId: string;
  correlationKey: string;
  tags?: string[];
  updatedAt: number;
  createdAt: number;
  lastSeen: number;
  blocked?: boolean;
  blockedAt: number;
  mergedInId?: string;
}
