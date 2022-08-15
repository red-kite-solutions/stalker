export const jwtConstants = {
  secret: process.env['FM_JWT_SECRET'],
  expirationTime: '300s',
};

export const rtConstants = {
  secret: process.env['FM_REFRESH_SECRET'],
  expirationTime: '25200s',
};

export const orchestratorConstants = {
  clientId: 'flow-manager',
  brokers: [process.env['KAFKA_URI']],
};

export const featureFlags = {
  orchestratorEnabled: process.env['FEATURE_ORCHESTRATOR_ENABLED'] === 'true',
};

export enum Role {
  User = 'user',
  Admin = 'admin',
  ReadOnly = 'read-only',
}

export const API_KEY = process.env.FM_API_KEY;
