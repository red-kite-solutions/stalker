import { MongoMemoryReplSet } from 'mongodb-memory-server';

module.exports = async function () {
  const mongo: MongoMemoryReplSet = globalThis.__IN_MEMORY_DB__;
  await mongo.stop();
};
