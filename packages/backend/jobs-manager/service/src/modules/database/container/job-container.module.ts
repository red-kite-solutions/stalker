import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { JobContainerController } from './job-container.controller';
import { jobContainerInitProvider } from './job-container.provider';
import { JobContainerService } from './job-container.service';

@Module({
  imports: [DatalayerModule],
  controllers: [JobContainerController],
  providers: [JobContainerService, ...jobContainerInitProvider],
  exports: [JobContainerService, ...jobContainerInitProvider],
})
export class JobContainerModule {}
