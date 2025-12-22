import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { ScopeActivationContext } from '../guards/scope-guard.utils';
import { ApiScope, ExtendedScope, ScopeOptions } from '../scopes.constants';

export const SCOPE_INFO_KEY = 'scopes';

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

  const scopeInfo: ScopeActivationContext = {
    scopes: scopeArray,
    scopeOptions: options,
  };

  return applyDecorators(
    ApiSecurity('apiKey', scopeInfo.scopes),
    ApiSecurity('bearer', scopeInfo.scopes),
    SetMetadata(SCOPE_INFO_KEY, scopeInfo),
  );
};
