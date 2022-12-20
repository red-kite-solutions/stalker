import { FindingCommand } from '../findings.command';

export class HostnameCommand extends FindingCommand {
  constructor(
    public readonly domainName: string,
    public readonly companyId: string,
  ) {
    super();
  }
}
