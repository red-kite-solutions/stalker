import { FindingCommand } from '../findings.command';

export class HostnameCommand extends FindingCommand {
  constructor(public readonly domainName: string) {
    super();
  }
}
