import { Group } from './groups.model';

const ADMIN_GROUP: Group = {
  name: 'admins',
  members: [],
  scopes: [],
};

const USER_GROUP: Group = {
  name: 'users',
  members: [],
  scopes: [],
};

const READONLY_GROUP: Group = {
  name: 'read-only',
  members: [],
  scopes: [],
};

export const DEFAULT_GROUPS: Group[] = [
  ADMIN_GROUP,
  USER_GROUP,
  READONLY_GROUP,
];
