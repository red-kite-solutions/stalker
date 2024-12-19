export const isProd = () => /^prod-?.*$/.test(process.env.JM_ENVIRONMENT);
export const isTest = () => process.env.JM_ENVIRONMENT === 'tests';
export const isDev = () => process.env.JM_ENVIRONMENT === 'dev';
export const isConsumerMode = () => process.env.JM_CONSUMER_MODE === 'true';

export const JM_ENVIRONMENTS = {
  dev: 'dev',
  tests: 'tests',
  prod: 'prod',
};
