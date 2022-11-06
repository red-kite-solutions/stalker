import { randomUUID } from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

module.exports = async function () {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_ADDRESS = uri;
  process.env.MONGO_DATABASE_NAME = randomUUID();
  process.env.TESTS = 'true';
  process.env.FM_API_KEY = '123456';
  process.env.FM_JWT_SECRET = '123456';
  process.env.FM_REFRESH_SECRET = '123456';
  globalThis.__IN_MEMORY_DB__ = mongo;
};
