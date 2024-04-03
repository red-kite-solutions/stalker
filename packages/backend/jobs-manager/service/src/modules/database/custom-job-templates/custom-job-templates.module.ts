import { Module } from '@nestjs/common';
import { QueueModule } from '../../job-queue/queue.module';
import { DatalayerModule } from '../datalayer.module';
import { CustomJobTemplatesController } from './custom-job-templates.controller';
import { jobTemplatessInitProvider } from './custom-job-templates.provider';
import { CustomJobTemplateService } from './custom-job-templates.service';

@Module({
  imports: [DatalayerModule, QueueModule],
  controllers: [CustomJobTemplatesController],
  providers: [CustomJobTemplateService, ...jobTemplatessInitProvider],
  exports: [CustomJobTemplateService, ...jobTemplatessInitProvider],
})
export class CustomJobTemplateModule {}
