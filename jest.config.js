module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@red-kite/common/(.*)$": "<rootDir>/packages/common/src/$1",
    "^@red-kite/frontend/(.*)$":
      "<rootDir>/packages/frontend/stalker-app/src/$1",
    "^@red-kite/jobs-manager/(.*)$":
      "<rootDir>/packages/backend/jobs-manager/service/src/$1",
    "^@red-kite/cron/(.*)$": "<rootDir>/packages/backend/cron/service/src/$1",
  },
  projects: [
    "<rootDir>/packages/frontend/stalker-app",
    "<rootDir>/packages/backend/jobs-manager/service",
    "<rootDir>/packages/backend/cron/service",
    "<rootDir>/packages/common",
  ],
};
