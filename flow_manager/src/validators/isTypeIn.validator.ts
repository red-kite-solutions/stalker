import {
  isNumberString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsTypeIn(
  types: Array<
    | 'string'
    | 'string-number'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'object'
    | 'function'
  >,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTypeIn',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (types.includes('string-number') && typeof value === 'string') {
            return isNumberString(value) || types.includes('string');
          }
          return types.includes(typeof value);
        },
      },
    });
  };
}
