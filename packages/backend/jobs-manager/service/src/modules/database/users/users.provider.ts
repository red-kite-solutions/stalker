import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isConsumerMode, isProd } from '../../app.constants';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { User } from './users.model';
import { Group } from '../groups/groups.model';
import { ADMIN_GROUP } from '../groups/groups.constants';
import { GROUP_INIT } from '../groups/groups.provider';

export const USER_INIT = 'USER_INIT';

export const userInitProvider = [
  {
    provide: USER_INIT,
    inject: [
      getModelToken('users'),
      getModelToken('groups'),
      { token: GROUP_INIT, optional: false },
    ],
    useFactory: async (userModel: Model<User>, groupModel: Model<Group>) => {
      if (isConsumerMode()) return;
      let user = await userModel.findOne({});
      if (user || isProd()) return;

      // Setting the default user in tests and dev environments for dev QoL
      // In other environments, the user has to be set at startup
      try {
        user = await userModel.create({
          email: 'admin@red-kite.io',
          firstName: 'stalker',
          lastName: 'admin',
          password:
            '$argon2i$v=19$m=4096,t=5,p=1$k50KD2XFU6e0fgqI+wRNSg$wN9LWB3tO+u+tY29lHx27XJhjKYTyEcWTfX5Z9q63i8', // admin
          active: true,
        });

        await groupModel.updateOne(
          { name: { $eq: ADMIN_GROUP.name } },
          { $addToSet: { members: user._id } },
        );
      } catch (err) {
        if (err.code !== MONGO_DUPLICATE_ERROR) throw err;
      }
    },
  },
];
