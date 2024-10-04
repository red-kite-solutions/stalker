import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { subscriptionsInitProvider } from './subscriptions.provider';

@Module({
  imports: [DatalayerModule],
  providers: [...subscriptionsInitProvider],
  exports: [...subscriptionsInitProvider],
})
export class SubscriptionsModule {}
