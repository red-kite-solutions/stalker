export interface PortNumber {
  _id: string;
  port: number;
  layer4Protocol: 'tcp' | 'udp';
  correlationKey: string;
}

export interface Port extends PortNumber {
  companyId: string;
  tags?: string[];
}
