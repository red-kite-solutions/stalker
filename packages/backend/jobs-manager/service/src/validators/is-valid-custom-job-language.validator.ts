import {
  isNotEmpty,
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { validCustomJobTypeDetails } from '../modules/database/jobs/models/custom-job.model';

export function IsValidCustomJobLanguage(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCustomJobLanguage',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!isNotEmpty(value) || !isString(value)) return false;
          const type = args.object['type'];

          if (
            !validCustomJobTypeDetails.some((cjtd) => {
              return cjtd.language === value && cjtd.type === type;
            })
          ) {
            return false;
          }

          return true;
        },
      },
    });
  };
}
