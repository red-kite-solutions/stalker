import { JM_ENVIRONMENTS } from '../../app.constants';

// HACK: This should probably be configured with an environment variable,
// but we kind of need to ship this workspaces feature.
export const EVENT_SUBSCRIPTIONS_FILES_PATH =
  process.env.JM_ENVIRONMENT === JM_ENVIRONMENTS.dev
    ? './src/modules/database/subscriptions/cron-subscriptions/built-in/'
    : '/server/dist/src/modules/database/subscriptions/event-subscriptions/built-in/';

export const CRON_SUBSCRIPTIONS_FILES_PATH =
  process.env.JM_ENVIRONMENT === JM_ENVIRONMENTS.dev
    ? './src/modules/database/subscriptions/event-subscriptions/built-in/'
    : '/server/dist/src/modules/database/subscriptions/cron-subscriptions/built-in/';
