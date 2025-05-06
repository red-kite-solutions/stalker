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

export function cidrStringToipv4Range(range: string) {
  const split = range.split('/');
  if (split.length !== 2) return null;
  return { ip: split[0], mask: Number(split[1]) };
}

export function numberToIpv4(ipNumber: number) {
  return (
    ((ipNumber >>> 24) & 0xff).toString() +
    '.' +
    ((ipNumber >>> 16) & 0xff).toString() +
    '.' +
    ((ipNumber >>> 8) & 0xff).toString() +
    '.' +
    (ipNumber & 0xff).toString()
  );
}

export function isIpRange(str: string) {
  return /^((25[0-5]|2[0-4][0-9]|1?\d{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?\d{1,2})\/([0-9]|[1-2][0-9]|3[0-2])$/.test(
    str,
  );
}
