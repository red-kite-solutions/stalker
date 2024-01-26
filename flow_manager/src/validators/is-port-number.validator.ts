import { isInt } from 'class-validator';

export function isPortNumber(port: unknown) {
  return isInt(port) && <number>port > 0 && <number>port <= 65535;
}
