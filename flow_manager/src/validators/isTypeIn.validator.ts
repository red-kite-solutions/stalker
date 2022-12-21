import {
  isArray,
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
    | 'array'
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
          if (types.includes('array') && typeof value === 'object') {
            return isArray(value) || types.includes('object');
          }
          return types.includes(typeof value);
        },
      },
    });
  };
}
