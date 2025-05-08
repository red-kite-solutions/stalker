import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { GroupsController } from './groups.controller';
import { groupInitProvider } from './groups.provider';
import { GroupsService } from './groups.service';

@Module({
  imports: [DatalayerModule],
  controllers: [GroupsController],
  providers: [GroupsService, ...groupInitProvider],
  exports: [GroupsService, ...groupInitProvider],
})
export class GroupsModule {}
