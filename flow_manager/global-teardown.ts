import { MongoMemoryServer } from 'mongodb-memory-server';

module.exports = async function () {
  const mongo: MongoMemoryServer = globalThis.__IN_MEMORY_DB__;
  mongo.stop();
};
