import { DomainSummary } from '../domain/domain.summary';

export interface Host {
  ip: string;
  _id: string;
  notes: string;
  domains: DomainSummary[];
  tags: string[];
  projectId: string;
  correlationKey: string;
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
  blocked: boolean;
  blockedAt: number;
}
