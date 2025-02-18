export function ipv4ToNumber(ip: string): number {
  const octets = ip.split('.').map(Number);
  return (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];
}

export function ipv4RangeToMinMax(
  ip: string,
  mask: number,
): { min: number; max: number } {
  const min = ipv4ToNumber(ip) & (-1 << (32 - mask));
  const max = min + Math.pow(2, 32 - mask) - 1;
  return { min, max };
}
