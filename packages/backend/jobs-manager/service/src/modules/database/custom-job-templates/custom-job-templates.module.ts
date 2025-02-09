import { Module } from '@nestjs/common';
import { DataSourcesModule } from '../../datasources/data-sources.module';
import { QueueModule } from '../../queues/queue.module';
import { DatalayerModule } from '../datalayer.module';
import { CustomJobTemplatesController } from './custom-job-templates.controller';
import { jobTemplatesInitProvider } from './custom-job-templates.provider';
import { CustomJobTemplateService } from './custom-job-templates.service';

@Module({
  imports: [DatalayerModule, QueueModule, DataSourcesModule],
  controllers: [CustomJobTemplatesController],
  providers: [CustomJobTemplateService, ...jobTemplatesInitProvider],
  exports: [CustomJobTemplateService, ...jobTemplatesInitProvider],
})
export class CustomJobTemplateModule {}
