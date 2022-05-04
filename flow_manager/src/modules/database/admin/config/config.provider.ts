import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_CONFIG } from './config.default';
import { Config } from './config.model';

export const DATABASE_INIT = 'DATABASE_INIT';

export const databaseConfigInitProvider = [
  {
    provide: DATABASE_INIT,
    inject: [getModelToken('config')],
    useFactory: async (configModel: Model<Config>) => {
      let config = await configModel.findOne({});
      if (!config?.keybaseConfig) {
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        await configModel.create(config);
      }
    },
  },
];
