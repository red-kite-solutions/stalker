export const ProjectUnassigned = 'unassigned';

import {
  isMongoId,
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsProjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isProjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isProjectId(value);
        },
      },
    });
  };
}

export function isProjectId(value: any) {
  return isString(value) && (isMongoId(value) || value === ProjectUnassigned);
}
