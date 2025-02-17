import { Module } from '@nestjs/common';
import { ConfigModule } from '../../admin/config/config.module';
import { DatalayerModule } from '../../datalayer.module';
import { FindingDefinitionController } from './finding-definition.controller';
import { FindingDefinitionService } from './finding-definition.service';

@Module({
  imports: [DatalayerModule, ConfigModule],
  controllers: [FindingDefinitionController],
  providers: [FindingDefinitionService],
  exports: [FindingDefinitionService],
})
export class FindingDefinitionsModule {}
