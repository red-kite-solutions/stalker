import { DomainSummary } from '../domain/domain.summary';

export interface Port {
  port: number;
  correlationKey: string;
}

export interface Host {
  ip: string;
  _id: string;
  notes: string;
  domains: DomainSummary[];
  tags: string[];
  companyId: string;
  ports: Port[];
  correlationKey: string;
}
