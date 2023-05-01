export interface PortNumber {
  _id: string;
  port: number;
  layer4Protocol: string; // tcp or udp
  correlationKey: string;
}

export interface Port extends PortNumber {
  companyId: string;
  tags?: string[];
}
