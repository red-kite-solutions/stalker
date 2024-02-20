import { Module } from '@nestjs/common';
import { DatalayerModule } from '../../../datalayer.module';

@Module({
  imports: [DatalayerModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class JobPodConfigModule {}
