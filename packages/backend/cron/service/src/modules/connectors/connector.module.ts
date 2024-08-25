import { Module } from '@nestjs/common';
import { AlarmConnector } from './alarm.connector';
import { CronConnector } from './cron.connector';

@Module({
  imports: [],
  controllers: [],
  providers: [CronConnector, AlarmConnector],
  exports: [CronConnector, AlarmConnector],
})
export class ConnectorModule {}
