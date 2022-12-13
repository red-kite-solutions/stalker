import { HostnameCommand } from './Findings/hostname.command';
import { HostnameHandler } from './Findings/hostname.handler';
import { HostnameIpCommand } from './JobFindings/hostname-ip.command';
import { HostnameIpHandler } from './JobFindings/hostname-ip.handler';
import { TcpPortsCommand } from './JobFindings/tcp-ports.command';
import { TcpPortsHandler } from './JobFindings/tcp-ports.handler';

export const FindingsCommandMapping = [
  {
    finding: 'HostnameIpFinding',
    handler: HostnameIpHandler,
    command: HostnameIpCommand,
  },
  {
    finding: 'HostnameFinding',
    handler: HostnameHandler,
    command: HostnameCommand,
  },
  {
    finding: 'TcpPortsFinding',
    handler: TcpPortsHandler,
    command: TcpPortsCommand,
  },
];

export const FindingsHandlers = FindingsCommandMapping.map((f) => f.handler);

export const FindingTypes = FindingsCommandMapping.map((f) => f.finding);
