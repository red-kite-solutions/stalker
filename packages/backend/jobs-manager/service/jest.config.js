const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../../../tsconfig.base.json');

module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '/src/.*\\.(test|spec).(ts|tsx|js)$',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,tsx,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageReporters: ['json', 'lcov'],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  rootDir: './',
  roots: ['<rootDir>'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../../../..',
  }),
};
