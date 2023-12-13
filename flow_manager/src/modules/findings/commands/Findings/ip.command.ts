import { IpFinding } from '../../findings.service';
import { FindingCommand } from '../findings.command';

export class IpCommand extends FindingCommand {
  constructor(
    companyId: string,
    commandType: string,
    public readonly finding: IpFinding,
  ) {
    super(companyId, commandType);
  }
}
