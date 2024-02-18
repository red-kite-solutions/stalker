import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  fmUrl: 'https://localhost:8443/api', // change to proper fmUrl
  fmWsUrl: 'wss://localhost:8443', // change to proper fmWsUrl
};
