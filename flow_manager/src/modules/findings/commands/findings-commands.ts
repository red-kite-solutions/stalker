import { HostnameHandler } from './Findings/hostname.handler';
import { HostnameIpHandler } from './JobFindings/hostname-ip.handler';
import { TcpPortsHandler } from './JobFindings/tcp-ports.handler';

export const FindingsCommands = [
  HostnameIpHandler,
  HostnameHandler,
  TcpPortsHandler,
];
