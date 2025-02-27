export function ipv4ToNumber(ip: string): number {
  const d = ip.split('.').map(Number);
  return ((+d[0] * 256 + +d[1]) * 256 + +d[2]) * 256 + +d[3];
}

export function ipv4RangeValuesToMinMax(
  ip: string,
  mask: number,
): { min: number; max: number } {
  const min = (ipv4ToNumber(ip) & (-1 << (32 - mask))) >>> 0;
  const max = min + Math.pow(2, 32 - mask) - 1;
  return { min, max };
}

export function ipv4RangeToMinMax(range: { ip: string; mask: number }): {
  min: number;
  max: number;
} {
  return ipv4RangeValuesToMinMax(range.ip, range.mask);
}

export function ipv4StringToipv4Range(range: string) {
  const split = range.split('/');
  if (split.length !== 2) return null;
  return { ip: split[0], mask: Number(split[1]) };
}
