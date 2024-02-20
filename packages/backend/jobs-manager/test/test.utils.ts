import { randomUUID } from 'crypto';

export function getName(testPrefix: string) {
  return `${testPrefix}-${randomUUID()}`;
}
