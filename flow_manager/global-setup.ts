import { randomUUID } from 'crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { FM_ENVIRONMENTS } from './src/modules/app.constants';

module.exports = async function () {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 3 } });
  const uri = mongo.getUri();
  process.env.MONGO_ADDRESS = uri;
  process.env.MONGO_DATABASE_NAME = randomUUID();
  process.env.FM_ENVIRONMENT = FM_ENVIRONMENTS.tests;
  process.env.FM_API_KEY = '123456';
  process.env.FM_JWT_SECRET = '123456';
  process.env.FM_REFRESH_SECRET = '123456';
  globalThis.__IN_MEMORY_DB__ = mongo;
};
