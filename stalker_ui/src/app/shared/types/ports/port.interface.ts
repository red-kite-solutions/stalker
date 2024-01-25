export interface PortNumber {
  _id: string;
  port: number;
  layer4Protocol: 'tcp' | 'udp';
  correlationKey: string;
}

export interface Port extends PortNumber {
  projectId: string;
  tags?: string[];
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
}
