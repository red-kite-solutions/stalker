import {
  isNumberString,
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isIPv4 } from 'net';

export function IsIpRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isIpRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isIpRange(value);
        },
      },
    });
  };
}

export function isIpRange(value: any) {
  if (!isString(value)) return false;
  if (value !== value.trim()) return false;

  const split = value.split('/');
  if (split.length !== 2) return false;

  if (!isNumberString(split[1])) return false;
  const mask = Number(split[1]);

  return isIPv4(split[0]) && mask >= 0 && mask <= 32;
}
