import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { TagsController } from './tag.controller';
import { TagsService } from './tag.service';

@Module({
  imports: [DatalayerModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
