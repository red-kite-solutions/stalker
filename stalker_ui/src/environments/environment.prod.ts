import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  fmUrl: `https://${window.location.hostname}:${window.location.port}/api`,
  fmWsUrl: `wss://${window.location.hostname}:${window.location.port}`,
};
