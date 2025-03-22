export interface IpRange {
  _id: string;
  ip: string;
  mask: number;
  projectId: string;
  correlationKey: string;
  ipMinInt: number;
  ipMaxInt: number;
  tags?: string[];
  updatedAt: number;
  createdAt: number;
  lastSeen: number;
  blocked?: boolean;
  blockedAt?: number;
}
