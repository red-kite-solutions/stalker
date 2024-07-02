import { Controller, UseGuards } from '@nestjs/common';
import { DevFeatureGuard } from '../../../guards/dev-feature.guard';
import { AlarmService } from './alarm.service';

@UseGuards(DevFeatureGuard)
@Controller('alarms')
export class AlarmController {
  constructor(private alarmService: AlarmService) {}
}
