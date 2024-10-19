import { Module } from '@nestjs/common';
import { DataSources } from './data-sources';

@Module({
  imports: [],
  providers: [DataSources],
  exports: [DataSources],
})
export class DataSourcesModule {}
