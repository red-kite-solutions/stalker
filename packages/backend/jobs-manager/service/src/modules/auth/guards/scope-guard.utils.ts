import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPE_OPTIONS_KEY, SCOPES_KEY } from '../decorators/scopes.decorator';
import { ApiScope, ExtendedScope, ScopeOptions } from '../scopes.constants';

export interface ScopeActivationContext {
  scopes: (ApiScope | ExtendedScope)[];
  scopeOptions: ScopeOptions;
}

/**
 * This code gets the scope given in the decorator scopes.decorator.ts, ex:
 *
 * \@Scopes(['manage:users:update'])
 *
 * @param reflector
 * @param context
 * @returns
 */
export function getRequiredScopes(
  reflector: Reflector,
  context: ExecutionContext,
): ScopeActivationContext {
  let requiredScopesArray = reflector.getAllAndOverride<
    (ApiScope | ExtendedScope)[]
  >(SCOPES_KEY, [context.getHandler(), context.getClass()]);

  const scopeOptions = reflector.getAllAndOverride<ScopeOptions>(
    SCOPE_OPTIONS_KEY,
    [context.getHandler(), context.getClass()],
  );

  requiredScopesArray = Array.isArray(requiredScopesArray)
    ? requiredScopesArray
    : [];

  return {
    scopes: requiredScopesArray,
    scopeOptions,
  };
}
