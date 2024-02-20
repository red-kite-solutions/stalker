const baseConfig = require('./jest.config.e2e');

module.exports = {
  ...baseConfig,
  reporters: [['github-actions', { silent: false }], 'summary'],
};
