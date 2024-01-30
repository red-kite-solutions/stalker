import { IpRangeFinding } from '../../findings.service';
import { FindingCommand } from '../findings.command';

export class IpRangeCommand extends FindingCommand {
  constructor(
    projectId: string,
    commandType: string,
    public readonly finding: IpRangeFinding,
  ) {
    super(projectId, commandType);
  }
}
