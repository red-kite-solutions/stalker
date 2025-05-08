import {
  ADMIN_DEFAULT_SCOPES,
  READONLY_DEFAULT_SCOPES,
  USER_DEFAULT_SCOPES,
} from '../../auth/scopes.constants';
import { Group } from './groups.model';

export const ADMIN_GROUP: Group = {
  name: 'admins',
  description: 'Has full control over the application.',
  members: [],
  scopes: ADMIN_DEFAULT_SCOPES,
  readonly: true,
};

const USER_GROUP: Group = {
  name: 'users',
  description: 'Can only use the application, but cannot configure.',
  members: [],
  scopes: USER_DEFAULT_SCOPES,
  readonly: false,
};

const READONLY_GROUP: Group = {
  name: 'read-only',
  description: 'Can only read data, not edit.',
  members: [],
  scopes: READONLY_DEFAULT_SCOPES,
  readonly: false,
};

export const DEFAULT_GROUPS: Group[] = [
  ADMIN_GROUP,
  USER_GROUP,
  READONLY_GROUP,
];
