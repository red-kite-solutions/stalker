import { HostSummary } from '../host/host.summary';

export interface PortNumber {
  _id: string;
  port: number;
  layer4Protocol: 'tcp' | 'udp';
  correlationKey: string;
}

export interface Port extends PortNumber {
  projectId: string;
  host: HostSummary;
  tags?: string[];
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
  blocked: boolean;
  blockedAt: number;
  service: string;
}
