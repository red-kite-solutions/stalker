module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  rootDir: '..',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '.e2e-spec.ts$',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,tsx,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  testTimeout: 70000,
  slowTestThreshold: 30,
  coverageReporters: ['json', 'lcov'],
};
