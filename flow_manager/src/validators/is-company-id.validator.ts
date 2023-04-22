export const CompanyUnassigned = 'unassigned';

import {
  isMongoId,
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsCompanyId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCompanyId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isCompanyId(value);
        },
      },
    });
  };
}

export function isCompanyId(value: any) {
  return isString(value) && (isMongoId(value) || value === CompanyUnassigned);
}
