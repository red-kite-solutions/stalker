import { SetMetadata } from '@nestjs/common';
import { ApiScope, ExtendedScope, ScopeOptions } from '../scopes.constants';

export const SCOPES_KEY = 'scopes';
export const SCOPE_OPTIONS_KEY = 'scopeOptions';
/**
 * One or many scopes that can access a route. By default, all the given scopes are required.
 *
 * If `options.mode` is set to `oneOf`, then only one scope is required.
 */
export const Scopes = (
  scope: (ApiScope | ExtendedScope) | (ApiScope | ExtendedScope)[],
  options: ScopeOptions = { mode: 'allOf' },
) => {
  const scopeArray = Array.isArray(scope) ? scope : [scope];
  return (
    SetMetadata(SCOPES_KEY, scopeArray) &&
    SetMetadata(SCOPE_OPTIONS_KEY, options)
  );
};
