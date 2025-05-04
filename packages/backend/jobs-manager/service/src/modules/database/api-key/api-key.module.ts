import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [DatalayerModule, GroupsModule],
  providers: [ApiKeyService],
  controllers: [ApiKeyController],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
