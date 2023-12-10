import { DomainSummary } from '../domain/domain.summary';

export interface Host {
  ip: string;
  _id: string;
  notes: string;
  domains: DomainSummary[];
  tags: string[];
  companyId: string;
  correlationKey: string;
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
}
