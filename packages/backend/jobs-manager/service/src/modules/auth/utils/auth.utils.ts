import * as argon2 from 'argon2';

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
  const uniqScopes = [...new Set(scopes)].sort();
  let wildcardPrefixes: string[] = [];
  const simplifiedScopes: string[] = [];

  for (const scope of uniqScopes) {
    if (scope.length && scope[scope.length - 1] === '*') {
      const index = wildcardPrefixes.findIndex((wp) => scope.startsWith(wp));
      if (index === -1) {
        wildcardPrefixes.push(scope.substring(0, scope.length - 1));
        simplifiedScopes.push(scope);
      }
    }
  }

  for (const scope of uniqScopes) {
    const index = wildcardPrefixes.findIndex((wp) => scope.startsWith(wp));

    if (index === -1) simplifiedScopes.push(scope);
  }

  return simplifiedScopes.sort();
}

export function userHasScope(requiredScope: string, userScopes: string[]) {
  // '*' is explicitely excluded as a possible valid scope to prevent including the reset password scope
  // Therefore, do not write: const possibleValidScopes = new Set(['*', requiredScope]);
  const possibleValidScopes = new Set([requiredScope]);
  const splitRequiredScope = requiredScope.split(':');

  for (let i = 0; i < splitRequiredScope.length - 1; ++i) {
    const newPossibility: string[] = [];
    for (let j = 0; j <= i; ++j) {
      newPossibility.push(splitRequiredScope[j]);
    }
    newPossibility.push('*');
    possibleValidScopes.add(newPossibility.join(':'));
  }

  const validScopes = [...possibleValidScopes];

  for (const userScope of userScopes) {
    if (validScopes.findIndex((v) => userScope === v) !== -1) return true;
  }
  return false;
}
