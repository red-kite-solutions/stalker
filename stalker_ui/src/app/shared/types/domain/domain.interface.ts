import { HostSummary } from '../host/host.summary';
import { Tag } from '../tag.type';

export interface Domain {
  name: string;
  _id: string;
  notes: string;
  hosts: HostSummary[];
  tags: Tag[];
  companyId: string;
}
