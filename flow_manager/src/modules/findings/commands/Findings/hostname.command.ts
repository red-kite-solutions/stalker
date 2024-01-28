import { HostnameFinding } from '../../findings.service';
import { FindingCommand } from '../findings.command';

export class HostnameCommand extends FindingCommand {
  constructor(
    projectId: string,
    commandType: string,
    public readonly finding: HostnameFinding,
  ) {
    super(projectId, commandType);
  }
}
