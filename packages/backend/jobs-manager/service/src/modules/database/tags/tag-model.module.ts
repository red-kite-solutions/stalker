import { MongooseModule } from '@nestjs/mongoose';
import { TagsSchema } from './tag.model';

export const TagModelModule = MongooseModule.forFeature([
  {
    name: 'tags',
    schema: TagsSchema,
  },
]);
