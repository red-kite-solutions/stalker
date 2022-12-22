import { HostnameCommand } from './Findings/hostname.command';
import { HostnameHandler } from './Findings/hostname.handler';
import { HostnameIpCommand } from './JobFindings/hostname-ip.command';
import { HostnameIpHandler } from './JobFindings/hostname-ip.handler';
import { PortCommand } from './JobFindings/port.command';
import { PortHandler } from './JobFindings/port.handler';

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
    finding: 'PortFinding',
    handler: PortHandler,
    command: PortCommand,
  },
];

export const FindingsHandlers = FindingsCommandMapping.map((f) => f.handler);

export const FindingTypes = FindingsCommandMapping.map((f) => f.finding);
