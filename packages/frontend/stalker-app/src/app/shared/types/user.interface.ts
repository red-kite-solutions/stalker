import { Group } from './group/group.type';

export interface ExtendedUser extends User {
  groups: Group[];
}

export interface User {
  firstName: string;
  lastName: string;
  _id: string;
  email: string;
  role: string;
  active: boolean;
}
