export class FindingCommand {}

export class JobFindingCommand extends FindingCommand {
  constructor(public readonly jobId) {
    super();
  }
}
