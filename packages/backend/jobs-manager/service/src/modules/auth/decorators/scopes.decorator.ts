import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'scopes';
export const Scopes = (scope: string) => SetMetadata(SCOPES_KEY, scope);
