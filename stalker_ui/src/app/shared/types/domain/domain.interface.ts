import { HostSummary } from '../host/host.summary';

export interface Domain {
  name: string;
  _id: string;
  notes: string;
  hosts: HostSummary[];
  tags: string[];
  projectId: string;
  correlationKey: string;
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
}
