import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { FindingHandlerBase } from '../findings-handler-base';
import { HostnameCommand } from './hostname.command';

@CommandHandler(HostnameCommand)
export class HostnameHandler extends FindingHandlerBase<HostnameCommand> {
  protected logger: Logger = new Logger('HostnameHandler');

  constructor() {
    super();
  }

  protected async executeCore(command: HostnameCommand) {
    // Launch a domain name resolving job
  }
}
