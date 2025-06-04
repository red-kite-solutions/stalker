import { Module } from '@nestjs/common';
import { DatalayerModule } from '../../datalayer.module';
import { TagsModule } from '../../tags/tag.module';
import { WebsiteModule } from '../websites/website.module';
import { PortController } from './port.controller';
import { PortService } from './port.service';
import { PortsFilterParser } from './ports-filter-parser';

@Module({
  imports: [DatalayerModule, TagsModule, WebsiteModule],
  controllers: [PortController],
  providers: [PortService, PortsFilterParser],
  exports: [PortService, PortsFilterParser],
})
export class PortModule {}
