import { Module } from '@nestjs/common';
import { CronConnector } from './cron.connector';

@Module({
  imports: [],
  controllers: [],
  providers: [CronConnector],
  exports: [CronConnector],
})
export class ConnectorModule {}
