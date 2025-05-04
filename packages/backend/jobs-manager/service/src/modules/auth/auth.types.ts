import { Request } from 'express';

export interface UserAuthContext {
  id: string;
  scopes: string[];
  email?: string;
  apiKeyId?: string;
}

export type AuthenticatedRequest = Request & { user: UserAuthContext };
