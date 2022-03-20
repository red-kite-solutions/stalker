export const jwtConstants = {
  secret: process.env['FM_JWT_SECRET'],
  expirationTime: '300s',
};

export const rtConstants = {
  secret: process.env['FM_JWT_SECRET'],
  expirationTime: '25200s',
};

export enum Role {
  User = 'user',
  Admin = 'admin',
  ReadOnly = 'read-only',
}

export const API_KEY = process.env.API_KEY;
