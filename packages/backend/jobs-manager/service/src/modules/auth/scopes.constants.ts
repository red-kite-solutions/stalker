export const RESET_PASSWORD_SCOPE = 'reset-password-self';

// These scopes cannot be added directly to a user through the API
export const ALL_EXCLUDED_SCOPES = [RESET_PASSWORD_SCOPE] as const;

/** Scopes that can't be given through the API */
export type ExtendedScope = (typeof ALL_EXCLUDED_SCOPES)[number];

// Groups
const MANAGE_GROUP_CREATE_SCOPE = 'manage:groups:create';
const MANAGE_GROUP_UDPATE_SCOPE = 'manage:groups:update';

export const GROUP_ADMIN_SCOPES = [
  MANAGE_GROUP_CREATE_SCOPE,
  MANAGE_GROUP_UDPATE_SCOPE,
];

// Users
export const MANAGE_USER_READ_ALL_SCOPE = 'manage:users:read-all';
export const MANAGE_USER_UPDATE_ALL_SCOPE = 'manage:users:update-all';

// API Keys
export const MANAGE_APIKEY_READ_ALL = 'manage:api-key:read-all';
export const MANAGE_APIKEY_DELETE_ALL = 'manage:api-key:delete-all';

export const API_SCOPES = [
  // Manage: Health
  'manage:health:version',

  // Manage: Projects
  'manage:projects:create',
  'manage:projects:read',
  'manage:projects:update',
  'manage:projects:delete',

  // Manage: Groups
  MANAGE_GROUP_CREATE_SCOPE,
  'manage:groups:read',
  MANAGE_GROUP_UDPATE_SCOPE,
  'manage:groups:delete',

  // Manage: Tags
  'manage:tags:create',
  'manage:tags:read',
  'manage:tags:update',
  'manage:tags:delete',

  // Manage: Secrets
  'manage:secrets:create',
  'manage:secrets:read',
  'manage:secrets:delete',

  // Manage: Users
  'manage:users:create',
  'manage:users:read',
  MANAGE_USER_READ_ALL_SCOPE,
  'manage:users:update',
  MANAGE_USER_UPDATE_ALL_SCOPE,
  'manage:users:delete',

  // Manage: API keys
  'manage:api-key:create',
  'manage:api-key:read',
  MANAGE_APIKEY_READ_ALL,
  'manage:api-key:delete',
  MANAGE_APIKEY_DELETE_ALL,

  // Manage: Variables
  'manage:variables:create',
  'manage:variables:read',
  'manage:variables:update',
  'manage:variables:delete',

  // Manage: Alarms
  'manage:alarms:create',
  'manage:alarms:read',
  'manage:alarms:update',
  'manage:alarms:delete',

  // Manage: Config
  'manage:config:create',
  'manage:config:read',
  'manage:config:update',
  'manage:config:delete',

  // Resources: domains
  'resources:domains:create',
  'resources:domains:read',
  'resources:domains:update',
  'resources:domains:delete',

  // Resources: hosts
  'resources:hosts:create',
  'resources:hosts:read',
  'resources:hosts:update',
  'resources:hosts:delete',

  // Resources: ports
  'resources:ports:create',
  'resources:ports:read',
  'resources:ports:update',
  'resources:ports:delete',

  // Resources: websites
  'resources:websites:create',
  'resources:websites:read',
  'resources:websites:update',
  'resources:websites:delete',

  // Resources: IP ranges
  'resources:ip-ranges:create',
  'resources:ip-ranges:read',
  'resources:ip-ranges:update',
  'resources:ip-ranges:delete',

  // Automation: Subscriptions
  'automation:subscriptions:create',
  'automation:subscriptions:read',
  'automation:subscriptions:update',
  'automation:subscriptions:delete',

  // Automation: Custom Jobs
  'automation:custom-jobs:create',
  'automation:custom-jobs:read',
  'automation:custom-jobs:update',
  'automation:custom-jobs:delete',
  'automation:custom-jobs:cache-sync',

  // Automation: Job Templates
  'automation:job-templates:create',
  'automation:job-templates:read',
  'automation:job-templates:update',
  'automation:job-templates:delete',

  // Automation: Job executions
  'automation:job-executions:create',
  'automation:job-executions:read',
  'automation:job-executions:update',
  'automation:job-executions:delete',

  // Automation: Containers
  'automation:job-containers:create',
  'automation:job-containers:read',
  'automation:job-containers:update',
  'automation:job-containers:delete',

  // Data: finding-definitions
  'data:finding-definitions:read',

  // Data: findings
  'data:findings:create',
  'data:findings:read',

  // Data: tables
  'data:tables:create',
  'data:tables:read',
  'data:tables:update',
  'data:tables:delete',
] as const;

/** Scopes that can be given through the API */
export type ApiScope = (typeof API_SCOPES)[number];

//#region Default group scopes
export const ADMIN_DEFAULT_SCOPES = [
  'manage:*',
  'resources:*',
  'automation:*',
  'data:*',
];

export const USER_DEFAULT_SCOPES = [
  'manage:projects:*',
  'manage:tags:*',
  'manage:secrets:*',
  'manage:users:read',
  'manage:users:update',
  'manage:api-key:create',
  'manage:api-key:read',
  'manage:api-key:delete',
  'manage:variables:*',
  'manage:alarms:*',
  'manage:config:read',
  'resources:*',
  'automation:*',
  'data:*',
];

export const READONLY_DEFAULT_SCOPES = [
  'manage:projects:read',
  'manage:tags:read',
  'manage:secrets:read',
  'manage:users:read',
  'manage:users:update',
  'manage:api-key:create',
  'manage:api-key:read',
  'manage:api-key:delete',
  'manage:variables:read',
  'manage:alarms:read',
  'manage:config:read',
  'resources:domains:read',
  'resources:hosts:read',
  'resources:ports:read',
  'resources:websites:read',
  'resources:ip-ranges:read',
  'automation:subscriptions:read',
  'automation:custom-jobs:read',
  'automation:job-templates:read',
  'automation:job-executions:read',
  'automation:job-containers:read',
  'data:finding-definitions:read',
  'data:findings:read',
  'data:tables:read',
];
//#endregion
