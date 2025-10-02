import * as argon2 from 'argon2';
import { ApiScope, ExtendedScope, ScopeOptions } from '../scopes.constants';

const options = {
  timeCost: 5,
};

export async function hashPassword(password: string) {
  return await argon2.hash(password, options);
}

export async function passwordEquals(hash: string, password: string) {
  return await argon2.verify(hash, password);
}

export function simplifyScopes(scopes: string[]) {
  const simplified = new Set<string>();

  for (const scope of scopes.sort()) {
    const parts = scope.split(':');
    let isRedundant = false;

    for (let i = parts.length - 1; i >= 0; --i) {
      const wildcardScope = [...parts.slice(0, i), '*'].join(':');
      if (simplified.has(wildcardScope)) {
        isRedundant = true;
        break;
      }
    }

    if (!isRedundant) {
      simplified.add(scope);
    }
  }

  return [...simplified];
}

export function userHasScope(scope: string, userScopes: string[]) {
  if (!Array.isArray(userScopes)) return false;

  const userScopesSet = new Set(userScopes);
  if (userScopesSet.has(scope)) return true;

  const parts = scope.split(':');

  // We omit '*', hence the i >= 1
  for (let i = parts.length - 1; i >= 1; i--) {
    const wildcardScope = [...parts.slice(0, i), '*'].join(':');
    if (userScopesSet.has(wildcardScope)) return true;
  }

  return false;
}

/**
 * This function is used in the Scopes guards.
 *
 * It validates the given scopes against the scopes contained in the JWT.
 * @param scopes The required scopes
 * @param user The user's JWT details
 * @param options Options on how to treat the scopes
 * @returns
 */
export const canActivateScopes = (
  scopes: (ApiScope | ExtendedScope)[],
  userScopes: string[],
  options: ScopeOptions,
) => {
  if (options.mode === 'oneOf') {
    // If user has any of the scopes required, the request can go through
    for (const scope of scopes)
      if (userHasScope(scope, userScopes)) return true;

    return false;
  }

  // All scopes are required
  for (const scope of scopes)
    if (!userHasScope(scope, userScopes)) return false;

  return true;
};
