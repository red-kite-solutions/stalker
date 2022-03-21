import {
  Controller,
  Patch,
  PreconditionFailedException,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../auth/constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
// import { UpdateIPAddressesDto } from './automation.dto';
// import { Job } from './jobs.model';
import { AutomationService } from './automation.service';

@Roles(Role.User)
@UseGuards(JwtAuthGuard, RolesGuard)
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
