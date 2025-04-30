import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isConsumerMode } from '../../app.constants';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { DEFAULT_GROUPS } from './groups.constants';
import { Group } from './groups.model';

export const GROUP_INIT = 'GROUP_INIT';

export const groupInitProvider = [
  {
    provide: GROUP_INIT,
    inject: [getModelToken('groups')],
    useFactory: async (groupModel: Model<Group>) => {
      if (isConsumerMode()) return;
      const group = await groupModel.findOne({});
      if (group) return;

      try {
        for (const group in DEFAULT_GROUPS) {
          await groupModel.create(group);
        }
      } catch (err) {
        if (err.code !== MONGO_DUPLICATE_ERROR) throw err;
      }
    },
  },
];
