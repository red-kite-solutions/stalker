import { Request } from 'express';
import { Role } from './constants';

export interface UserAuthContext {
  id: string;
  role: Role;
  email?: string;
  apiKeyId?: string;
}

export type AuthenticatedRequest = Request & { user: UserAuthContext };
