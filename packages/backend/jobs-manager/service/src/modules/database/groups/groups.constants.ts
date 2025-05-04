import {
  ADMIN_DEFAULT_SCOPES,
  READONLY_DEFAULT_SCOPES,
  USER_DEFAULT_SCOPES,
} from '../../auth/scopes.constants';
import { Group } from './groups.model';

export const ADMIN_GROUP: Group = {
  name: 'admins',
  members: [],
  scopes: ADMIN_DEFAULT_SCOPES,
  readonly: true,
};

const USER_GROUP: Group = {
  name: 'users',
  members: [],
  scopes: USER_DEFAULT_SCOPES,
  readonly: false,
};

const READONLY_GROUP: Group = {
  name: 'read-only',
  members: [],
  scopes: READONLY_DEFAULT_SCOPES,
  readonly: false,
};

export const DEFAULT_GROUPS: Group[] = [
  ADMIN_GROUP,
  USER_GROUP,
  READONLY_GROUP,
];
