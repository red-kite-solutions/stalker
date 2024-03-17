import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { validCustomJobTypeDetails } from '../modules/database/jobs/models/custom-job.model';

export function IsValidFindingHandlerLanguage(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidFindingHandlerLanguage',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const findingHandler = args.object['findingHandler'];
          const type = args.object['type'];
          const language = args.object['language'];
          if (findingHandler === undefined && value == undefined) return true;

          if (findingHandler && !value) return false;

          if (
            !validCustomJobTypeDetails.some((cjtd) => {
              return (
                cjtd.language === language &&
                cjtd.type === type &&
                cjtd.handlerLanguage === value
              );
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
