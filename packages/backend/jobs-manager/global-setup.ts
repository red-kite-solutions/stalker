import { randomUUID } from 'crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { JM_ENVIRONMENTS } from './src/modules/app.constants';

module.exports = async function () {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 3 } });
  await mongo.waitUntilRunning();
  const uri = mongo.getUri();
  process.env.MONGO_ADDRESS = uri;
  process.env.MONGO_DATABASE_NAME = randomUUID();
  process.env.JM_ENVIRONMENT = JM_ENVIRONMENTS.tests;
  process.env.TEST_TYPE = 'unit';
  process.env.STALKER_CRON_API_TOKEN = '123456';
  process.env.JM_JWT_SECRET = '123456';
  process.env.JM_REFRESH_SECRET = '123456';
  process.env.SECRET_PUBLIC_RSA_KEY =
    'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFzZjhKazZJcXpaMGJkcDQ2NFd0NQpvQlNoa1RxUWZJOTZaQ25FS0F0VFh0VkVPR254Z3VwRFNlN3lKU3BEbFo1bmptOVk1Nitpb1VlR1htQmt5QzVLClF0MzBncThGSzZXdFFQRWNOZCtzdVJhMWY3UVZpa0Q1YUs5WEVpN2lld1FGQ05oMFgzbVFaQ0R5OEhCalJrc1QKMTJiRmdhcC9NMHpyeWtkTnM0dUZxYXl5Rlk4YWxMVENRNlNhakZNemhJbHAxK0lTUTVFR011MjAvZUY3RkQwbwpZWGh4SjZZZEhaYUdIczYrSVdMT1NDYkZpcmdKTUFqdWZhMUdHb3N4WlJSd3lIdXRVTG11Z05YWWdaS2piQis0CldaNnNPZFRrb0tmQmtyNjlWcXNFeXZXeTlHd1g4cWFMV3dyTTM1c1owSWdiRk5RQTNEM2V5eGxacDh4K1R6R1EKZ1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==';
  globalThis.__IN_MEMORY_DB__ = mongo;
};
