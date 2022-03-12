import { Controller, Patch, PreconditionFailedException } from '@nestjs/common';
// import { UpdateIPAddressesDto } from './automation.dto';
// import { Job } from './jobs.model';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  private ipRefreshRunning: boolean;
  constructor(private readonly automationService: AutomationService) {
    this.ipRefreshRunning = false;
  }

  @Patch('update/ips')
  async manualGlobalIPRefresh(): Promise<void> {
    // Not sure that this check really has an important effect in preventing a user to request 20 manual Ip refreshes
    if (!this.ipRefreshRunning) {
      this.ipRefreshRunning = true;
      await this.automationService.refreshIpAdresses();
      this.ipRefreshRunning = false;
    } else {
      throw new PreconditionFailedException(
        "A manual accross programs IP refresh is currently running. You can't run more than one at the time.",
      );
    }
  }
}
