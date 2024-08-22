import { isProd } from '../../app.constants';

// HACK: This should probably be configured with an environment variable,
// but we kind of need to ship this workspaces feature.
export const EVENT_SUBSCRIPTIONS_FILES_PATH = isProd()
  ? '/server/dist/src/modules/database/subscriptions/event-subscriptions/built-in/'
  : './src/modules/database/subscriptions/event-subscriptions/built-in/';

export const CRON_SUBSCRIPTIONS_FILES_PATH = isProd()
  ? '/server/dist/src/modules/database/subscriptions/cron-subscriptions/built-in/'
  : './src/modules/database/subscriptions/cron-subscriptions/built-in/';
