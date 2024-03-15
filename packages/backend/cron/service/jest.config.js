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
};
