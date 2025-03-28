module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  projects: [
    "<rootDir>/packages/backend/*/service/jest.config.js",
    "<rootDir>/packages/*/jest.config.js",
  ],
};
