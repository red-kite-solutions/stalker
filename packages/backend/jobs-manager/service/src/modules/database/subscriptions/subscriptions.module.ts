import { Module } from '@nestjs/common';
import { DataSourcesModule } from '../../datasources/data-sources.module';
import { DatalayerModule } from '../datalayer.module';
import { subscriptionsInitProvider } from './subscriptions.provider';

@Module({
  imports: [DatalayerModule, DataSourcesModule],
  providers: [...subscriptionsInitProvider],
  exports: [...subscriptionsInitProvider],
})
export class SubscriptionsModule {}
