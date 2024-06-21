import { HostnameCommand } from './Findings/hostname.command';
import { HostnameHandler } from './Findings/hostname.handler';
import { IpCommand } from './Findings/ip.command';
import { IpHandler } from './Findings/ip.handler';
import { CustomFindingCommand } from './JobFindings/custom.command';
import { CustomFindingHandler } from './JobFindings/custom.handler';
import { HostnameIpCommand } from './JobFindings/hostname-ip.command';
import { HostnameIpHandler } from './JobFindings/hostname-ip.handler';
import { PortCommand } from './JobFindings/port.command';
import { PortHandler } from './JobFindings/port.handler';
import { WebsiteCommand } from './JobFindings/website.command';
import { WebsiteHandler } from './JobFindings/website.handler';

export const FindingsCommandMapping = [
  {
    finding: 'HostnameIpFinding',
    handler: HostnameIpHandler,
    command: HostnameIpCommand,
  },
  {
    finding: 'IpFinding',
    handler: IpHandler,
    command: IpCommand,
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
  {
    finding: 'WebsiteFinding',
    handler: WebsiteHandler,
    command: WebsiteCommand,
  },
  {
    finding: 'CustomFinding',
    handler: CustomFindingHandler,
    command: CustomFindingCommand,
  },
];

export const FindingsHandlers = FindingsCommandMapping.map((f) => f.handler);

export const FindingTypes = FindingsCommandMapping.map((f) => f.finding);
