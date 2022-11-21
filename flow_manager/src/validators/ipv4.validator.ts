import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsIPv4(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isIPv4',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            typeof value === 'string' &&
            /^\d\d?\d?\.\d\d?\d?\.\d\d?\d?\.\d\d?\d?$/.test(value) &&
            value
              .split('.')
              .map((x) => +x)
              .filter((x) => x >= 0 && x <= 255).length === 4
          );
        },
      },
    });
  };
}
