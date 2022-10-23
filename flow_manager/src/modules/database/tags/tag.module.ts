import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagsController } from './tag.controller';
import { TagsSchema } from './tag.model';
import { TagsService } from './tag.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'tags',
        schema: TagsSchema,
      },
    ]),
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
