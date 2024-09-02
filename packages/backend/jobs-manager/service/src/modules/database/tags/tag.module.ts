import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { TagsController } from './tag.controller';
import { tagsInitProvider } from './tag.provider';
import { TagsService } from './tag.service';

@Module({
  imports: [DatalayerModule],
  controllers: [TagsController],
  providers: [TagsService, ...tagsInitProvider],
  exports: [TagsService, ...tagsInitProvider],
})
export class TagsModule {}
