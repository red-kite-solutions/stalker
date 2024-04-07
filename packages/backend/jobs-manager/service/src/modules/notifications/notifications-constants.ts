// HACK: This should probably be configured with an environment variable,

import { JM_ENVIRONMENTS } from '../app.constants';

// but we kind of need to ship this workspaces feature.
export const EMAIL_TEMPLATES_PATH =
  process.env.JM_ENVIRONMENT === JM_ENVIRONMENTS.prod
    ? '/server/dist/src/modules/notifications/emails/templates/'
    : './src/modules/notifications/emails/templates/';

export const EMAIL_RECIPIENTS_FILTER_LIST =
  process.env.EMAIL_RECIPIENTS_FILTER_LIST?.split(',') ?? [];

// In production, we treat the list as a "block list". This means the recipient won't recieve the email if they are part of the list.
// In development, we treat the list as an "allow list". This means the recipient will recieve the email only if they are part of the list.
export const EMAIL_RECIPIENTS_FILTER_LIST_MODE =
  process.env.JM_ENVIRONMENT === JM_ENVIRONMENTS.prod
    ? 'block-list'
    : 'allow-list';

export const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
export const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET;

console.log(process.env);
