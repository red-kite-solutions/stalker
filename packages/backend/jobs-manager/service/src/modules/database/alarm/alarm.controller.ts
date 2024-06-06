import { Controller, UseGuards } from '@nestjs/common';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { AlarmService } from './alarm.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('alarms')
export class AlarmController {
  constructor(private alarmService: AlarmService) {}
}
