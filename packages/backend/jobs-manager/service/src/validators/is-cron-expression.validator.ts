import {
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isValidCron } from 'cron-validator';

export function IsCronExpression(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCronExpression',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isCronExpression(value);
        },
      },
    });
  };
}

export function isCronExpression(value: any) {
  return (
    isString(value) &&
    isValidCron(value, { seconds: true, alias: true, allowBlankDay: true })
  );
}
