export const RESET_PASSWORD_SCOPE = 'reset-password-self';

// These scopes cannot be added directly to a user through the API
export const ALL_EXCLUDED_SCOPES = [RESET_PASSWORD_SCOPE];

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

export const ALL_SCOPES = [
  // API keys
  MANAGE_APIKEY_READ_ALL,
  MANAGE_APIKEY_DELETE_ALL,
  // Groups
  MANAGE_GROUP_CREATE_SCOPE,
  MANAGE_GROUP_UDPATE_SCOPE,
  // Users
  MANAGE_USER_READ_ALL_SCOPE,
  MANAGE_USER_UPDATE_ALL_SCOPE,
] as const;
type ApiScope = (typeof ALL_SCOPES)[number];

//#region Default groups scope definitions
export const ADMIN_DEFAULT_SCOPES = [
  'manage:*',
  'resources:*',
  'automation:*',
  'data:*',
];

export const USER_DEFAULT_SCOPES = [];

export const READONLY_DEFAULT_SCOPES = [];
//#endregion
