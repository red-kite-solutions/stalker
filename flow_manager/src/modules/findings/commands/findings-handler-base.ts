import { Logger } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { FindingCommand } from './findings.command';

export abstract class FindingHandlerBase<T extends FindingCommand>
  implements ICommandHandler<T>
{
  protected abstract logger: Logger;

  constructor() {}

  public async execute(command: T) {
    await this.executeCore(command);
  }

  protected abstract executeCore(command: T): Promise<unknown | void>;
}
