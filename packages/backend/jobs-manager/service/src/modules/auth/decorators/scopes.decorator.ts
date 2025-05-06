import { SetMetadata } from '@nestjs/common';
import { ApiScope, ExtendedScope } from '../scopes.constants';

export const SCOPES_KEY = 'scopes';
/**One or many scopes that can access a route. If a user has any of the scopes, the request goes through. */
export const Scopes = (
  scope: (ApiScope | ExtendedScope) | (ApiScope | ExtendedScope)[],
) => SetMetadata(SCOPES_KEY, scope);
