import { Module } from '@nestjs/common';
import { DatalayerModule } from '../../datalayer.module';
import { TagsModule } from '../../tags/tag.module';
import { PortController } from './port.controller';
import { PortService } from './port.service';

@Module({
  imports: [DatalayerModule, TagsModule],
  controllers: [PortController],
  providers: [PortService],
  exports: [PortService],
})
export class PortModule {}
