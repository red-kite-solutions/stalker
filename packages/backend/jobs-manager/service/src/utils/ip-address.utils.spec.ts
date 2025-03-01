import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../modules/app.controller';
import { AppService } from '../modules/app.service';
import {
  ipv4RangeToMinMax,
  ipv4RangeValuesToMinMax,
  ipv4StringToipv4Range,
  ipv4ToNumber,
  numberToIpv4,
} from './ip-address.utils';

const ipAddressRanges = [
  {
    ip: '192.168.0.1',
    mask: 24,
    min: 3232235520,
    max: 3232235775,
  },
  {
    ip: '0.0.0.0',
    mask: 32,
    min: 0,
    max: 0,
  },
  {
    ip: '0.0.0.0',
    mask: 0,
    min: 0,
    max: 4294967295,
  },
  {
    ip: '206.189.173.197',
    mask: 32,
    min: 3468537285,
    max: 3468537285,
  },
  {
    ip: '192.168.0.1',
    mask: 32,
    min: 3232235520,
    max: 3232251903,
  },
];

describe('IP address utils', () => {
  let moduleFixture: TestingModule;
  let appController: AppController;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = moduleFixture.get<AppController>(AppController);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('IP range calculations', () => {
    it.each([
      { ip: '127.0.0.1', value: 2130706433 },
      { ip: '0.0.0.0', value: 0 },
      { ip: '255.255.255.255', value: 4294967295 },
      { ip: '1.2.3.4', value: 16909060 },
    ])(`Should transform an IP to its integer value %s`, ({ ip, value }) => {
      // Arrange & Act
      const result = ipv4ToNumber(ip);

      // Assert
      expect(result).toStrictEqual(value);
    });

    it.each([
      { ip: '127.0.0.1', value: 2130706433 },
      { ip: '0.0.0.0', value: 0 },
      { ip: '255.255.255.255', value: 4294967295 },
      { ip: '1.2.3.4', value: 16909060 },
    ])(`Should transform an IP to its integer value %s`, ({ ip, value }) => {
      // Arrange & Act
      const result = numberToIpv4(value);

      // Arrange & Act & Assert
      expect(result).toStrictEqual(ip);
    });

    it.each([ipAddressRanges])(
      `Should find the min and max values for IP range %s`,
      ({ ip, mask, min, max }) => {
        // Arrange & Act
        const minMax = ipv4RangeValuesToMinMax(ip, mask);

        // Assert
        expect(minMax.min).toStrictEqual(min);
        expect(minMax.max).toStrictEqual(max);
      },
    );

    it.each([ipAddressRanges])(
      `Should find the min and max values for IP range in string format %s`,
      ({ ip, mask, min, max }) => {
        // Arrange & Act
        const minMax = ipv4RangeToMinMax(
          ipv4StringToipv4Range(ip + '/' + mask.toString()),
        );

        // Assert
        expect(minMax.min).toStrictEqual(min);
        expect(minMax.max).toStrictEqual(max);
      },
    );
  });
});
