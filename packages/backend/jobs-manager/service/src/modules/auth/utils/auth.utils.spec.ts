import { ApiScope } from '../scopes.constants';
import { canActivateScopes, simplifyScopes, userHasScope } from './auth.utils';

describe('Auth Utils', () => {
  describe('Scopes', () => {
    it.each([
      {
        scopes: ['asdf', 'qwerty:asdf'],
        expectedScopes: ['asdf', 'qwerty:asdf'],
      },
      {
        scopes: ['asdf', 'qwerty:asdf', 'qwerty:*'],
        expectedScopes: ['asdf', 'qwerty:*'],
      },
      {
        scopes: ['asdf', '*', 'qwerty:*', 'qwerty:asdf'],
        expectedScopes: ['*'],
      },
      {
        scopes: ['qwerty:*', 'asdf:*', 'qwerty:asdf', 'qwerty:*'],
        expectedScopes: ['qwerty:*', 'asdf:*'],
      },
      {
        scopes: [
          'qwerty:*',
          'asdf:uiop:*',
          'asdf:*',
          'qwerty:uiop:*',
          'qwerty:asdf',
          'qwerty:*',
        ],
        expectedScopes: ['qwerty:*', 'asdf:*'],
      },
      {
        scopes: ['qwerty:asdf', 'qwerty:uiop:*', 'qwerty:zxcv:*', 'qwerty:*'],
        expectedScopes: ['qwerty:*'],
      },
    ])('Simplify scopes: %s', ({ scopes, expectedScopes }) => {
      // Arrange && Act
      const simplifiedScopes = simplifyScopes(scopes);

      // Assert
      expect(simplifiedScopes).toStrictEqual(expectedScopes.sort());
    });

    it.each([
      {
        userScopes: ['asdf', 'qwerty:asdf'],
        requiredScope: 'asdf',
        hasScope: true,
      },
      {
        userScopes: ['asdf', 'qwerty:asdf'],
        requiredScope: 'qwerty:asdf',
        hasScope: true,
      },
      {
        userScopes: ['asdf', 'qwerty:asdf'],
        requiredScope: 'qwerty:uiop',
        hasScope: false,
      },
      {
        userScopes: ['asdf', 'qwerty:*'],
        requiredScope: 'qwerty:uiop',
        hasScope: true,
      },
      {
        userScopes: ['asdf', 'qwerty:*', '*'],
        requiredScope: 'uiop:jkl',
        hasScope: false,
      },
      {
        userScopes: ['asdf:qwerty', 'qwerty:*'],
        requiredScope: 'uiop:jkl',
        hasScope: false,
      },
    ])('User has scope: %s', ({ userScopes, requiredScope, hasScope }) => {
      // Arrange && Act
      const result = userHasScope(requiredScope as ApiScope, userScopes);

      // Assert
      expect(result).toStrictEqual(hasScope);
    });

    it.each([
      {
        userScopes: ['asdf', 'qwerty:asdf'],
        requiredScopes: ['asdf'],
        scopeOptions: { mode: 'allOf' },
        expected: true,
      },
      {
        userScopes: ['asdf', 'qwerty:asdf'],
        requiredScopes: ['qwerty:asdf', 'uiop'],
        scopeOptions: { mode: 'allOf' },
        expected: false,
      },
      {
        userScopes: ['asdf', 'qwerty:asdf'],
        requiredScopes: ['qwerty:asdf', 'uiop'],
        scopeOptions: { mode: 'oneOf' },
        expected: true,
      },
      {
        userScopes: [],
        requiredScopes: ['qwerty:uiop'],
        scopeOptions: { mode: 'allOf' },
        expected: false,
      },
      {
        userScopes: [],
        requiredScopes: ['qwerty:uiop'],
        scopeOptions: { mode: 'oneOf' },
        expected: false,
      },
      {
        userScopes: ['asdf', 'qwerty:*'],
        requiredScopes: ['qwerty:uiop'],
        scopeOptions: { mode: 'allOf' },
        expected: true,
      },
      {
        userScopes: ['asdf', 'qwerty:*', '*'],
        requiredScopes: ['uiop:jkl', 'qwerty:asdf'],
        scopeOptions: { mode: 'allOf' },
        expected: false,
      },
      {
        userScopes: ['asdf', 'qwerty:*', '*'],
        requiredScopes: ['uiop:jkl', 'qwerty:asdf'],
        scopeOptions: { mode: 'oneOf' },
        expected: true,
      },
      {
        userScopes: ['asdf:qwerty', 'qwerty:*'],
        requiredScopes: ['asdf:qwerty', 'qwerty:asdf'],
        scopeOptions: { mode: 'allOf' },
        expected: true,
      },
    ])(
      '[%#] User can activate a route: %s',
      ({ userScopes, requiredScopes, scopeOptions, expected }) => {
        // Arrange && Act
        const result = canActivateScopes(
          requiredScopes as ApiScope[],
          userScopes,
          { mode: <'allOf' | 'oneOf'>scopeOptions.mode },
        );

        // Assert
        expect(result).toStrictEqual(expected);
      },
    );
  });
});
