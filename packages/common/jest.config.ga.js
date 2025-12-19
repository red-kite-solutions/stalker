const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  reporters: [['github-actions', { silent: false }], 'default'],
};
