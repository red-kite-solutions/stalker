import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { AlarmController } from './alarm.controller';
import { alarmInitProvider } from './alarm.provider';
import { AlarmService } from './alarm.service';

@Module({
  imports: [DatalayerModule],
  providers: [AlarmService, ...alarmInitProvider],
  controllers: [AlarmController],
  exports: [AlarmService, ...alarmInitProvider],
})
export class AlarmModule {}
