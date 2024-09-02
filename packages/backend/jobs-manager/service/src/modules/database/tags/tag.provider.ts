import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_TAGS } from './tag.constants';
import { Tag } from './tag.model';

export const TAGS_INIT = 'TAGS_INIT';

export const tagsInitProvider = [
  {
    provide: TAGS_INIT,
    inject: [getModelToken('tags')],
    useFactory: async (tagsModel: Model<Tag>) => {
      const anyTag = await tagsModel.findOne();

      if (anyTag) return;

      for (const tag of DEFAULT_TAGS) await tagsModel.create(tag);
    },
  },
];
