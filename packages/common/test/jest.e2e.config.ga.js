const baseConfig = require('./jest.e2e.config');

module.exports = {
  ...baseConfig,
  reporters: [['github-actions', { silent: false }], 'default'],
};
