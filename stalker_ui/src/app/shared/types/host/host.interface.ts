import { DomainSummary } from '../domain/domain.summary';
import { Tag } from '../tag.type';

export interface Host {
  ip: string;
  _id: string;
  notes: string;
  domains: DomainSummary[];
  tags: Tag[];
  companyId: string;
  ports: number[];
}
