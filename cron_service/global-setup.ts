import { randomUUID } from 'crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

module.exports = async function () {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 3 } });
  const uri = mongo.getUri();
  process.env.MONGO_ADDRESS = uri;
  process.env.MONGO_DATABASE_NAME = randomUUID();
  process.env.FM_ENVIRONMENT = 'tests';
  process.env.STALKER_CRON_API_TOKEN = '123456';
  globalThis.__IN_MEMORY_DB__ = mongo;
};
