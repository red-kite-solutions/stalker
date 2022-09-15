import { Address4 } from 'ip-address';

export class Ipv4Subnet {
  private _ip!: string;
  private _minIp!: string;
  private _maxIp!: string;
  private _longMask!: string;
  private _shortMask!: string;
  private _ipCount!: number;

  public get ip(): string {
    return this._ip;
  }

  public set ip(v: string) {
    if (!Ipv4Subnet.isValidIp(v)) {
      throw new Ipv4InvalidError(v);
    }
    this._ip = v;
    this.setMinMaxIp();
  }

  public get minIp(): string {
    return this._minIp;
  }

  public get maxIp(): string {
    return this._maxIp;
  }

  public get longMask(): string {
    return this._longMask;
  }

  public get shortMask(): string {
    return this._shortMask;
  }

  public get ipCount(): number {
    return this._ipCount;
  }

  public set mask(v: string) {
    const masks = Ipv4Subnet.createMask(v);
    this._shortMask = masks.shortMask;
    this._longMask = masks.longMask;
    this.setMinMaxIp();
  }

  /**
   * Creates an Ipv4Subnet representing the different values in a subnet
   * @param ip In the format 192.168.0.12
   * @param mask In the format /24 or 255.255.255.0
   */
  constructor(ip: string, mask: string) {
    this._ip = ip;
    this.mask = mask;
    this._ipCount = 2 ** (32 - parseInt(this._shortMask.slice(1)));
  }

  /**
   * Creates a long IP mask string from a short IP mask string
   * @param shortMask A valid short IP mask in the format /24
   * @returns A long IP mask in the format 255.255.255.0
   */
  public static createLongMaskFromShort(shortMask: string): string {
    if (!this.isValidShortMask(shortMask)) {
      throw new Ipv4MaskInvalidError(shortMask);
    }
    const numMask = parseInt(shortMask.slice(1));
    const ipParts = [0, 0, 0, 0];
    for (let i = 0; i < 32; ++i) {
      const ipPart = Math.floor(i / 8);
      ipParts[ipPart] = ipParts[ipPart] << 1;
      if (i < numMask) {
        ipParts[ipPart]++;
      }
    }
    const strIpParts = [ipParts[0].toString(), ipParts[1].toString(), ipParts[2].toString(), ipParts[3].toString()];
    return strIpParts.join('.');
  }

  /**
   * Creates a short IP mask string from a long IP mask string
   * @param longMask A valid long IP mask in the format 255.255.255.0
   * @returns A short IP mask in the format /24
   */
  public static createShortMaskFromLong(longMask: string): string {
    if (!this.isValidLongMask(longMask)) {
      throw new Ipv4MaskInvalidError(longMask);
    }
    const a4 = new Address4(longMask);
    const binaryStringMask = a4.binaryZeroPad();
    const index = binaryStringMask.indexOf('0');
    const numMask = binaryStringMask.slice(0, index === -1 ? 32 : index).length;
    return `/${numMask}`;
  }

  /**
   * Creates an IP mask, short and long, from a short or long mask input
   * Used to ensure that you have both long and short mask values, regardless
   * of the mask given as input.
   * @param mask A valid long or short IP mask in the format 255.255.255.0 or /24
   * @returns An object containing a short mask value and a long mask value as strings
   */
  public static createMask(mask: string) {
    if (!this.isValidLongMask(mask) && !this.isValidShortMask(mask)) {
      throw new Ipv4MaskInvalidError(mask);
    }

    let short;
    let long;
    if (mask[0] === '/') {
      short = mask;
      long = Ipv4Subnet.createLongMaskFromShort(short);
    } else {
      long = mask;
      short = Ipv4Subnet.createShortMaskFromLong(long);
    }
    return { shortMask: short, longMask: long };
  }

  /**
   * Validates the format of a short IP mask string
   * @param shortMask A short IP mask string
   * @returns `true` if the value is a valid short IP mask string (ex: /24)
   */
  public static isValidShortMask(shortMask: string): boolean {
    if (!shortMask) return false;
    return /^\/\d\d?$/.test(shortMask) && parseInt(shortMask.slice(1)) <= 32;
  }

  /**
   * Validates the format of a long IP mask string
   * @param longMask A long IP mask string
   * @returns `true` if the value is a valid long IP mask string (ex: 255.255.255.0)
   */
  public static isValidLongMask(longMask: string): boolean {
    if (!longMask) return false;

    if (!/^\d\d?\d?\.\d\d?\d?\.\d\d?\d?\.\d\d?\d?$/.test(longMask)) return false;

    let binMask = 0;
    const splits = longMask.split('.');
    for (const i of splits) {
      const part = parseInt(i);
      if (part > 255) return false;

      binMask = (binMask << 8) >>> 0;
      binMask += part;
    }

    let zeroState = true;
    binMask = binMask;
    for (let i = 0; i < 32; ++i) {
      const bit = binMask & 1;
      binMask = binMask >> 1;
      if (bit === 1) {
        zeroState = false;
      } else if (bit === 0 && zeroState === false) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates the format of an IPv4 address string
   * @param ip An IP version 4 address in the string format
   * @returns `true` if the value os a valid IPv4 address (ex: 192.168.0.12)
   */
  public static isValidIp(ip: string) {
    if (!ip) return false;
    if (!/^\d\d?\d?\.\d\d?\d?\.\d\d?\d?\.\d\d?\d?$/.test(ip)) return false;
    return Address4.isValid(ip);
  }

  private setMinMaxIp() {
    const numMask = parseInt(this._shortMask.slice(1));
    const a4 = new Address4(this._ip);
    a4.subnetMask = numMask;
    this._minIp = a4.startAddress().address;
    this._maxIp = a4.endAddress().address;
  }
}

export class Ipv4MaskInvalidError extends Error {
  constructor(mask: string | undefined = undefined) {
    super(`The given mask was in an invalid format : ${mask}`);
  }
}

export class Ipv4InvalidError extends Error {
  constructor(ip: string | undefined = undefined) {
    super(`The given ip was in an invalid format : ${ip}`);
  }
}
