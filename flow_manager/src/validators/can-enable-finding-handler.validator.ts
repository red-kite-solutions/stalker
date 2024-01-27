import {
  isBoolean,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { validCustomJobTypeDetails } from '../modules/database/jobs/models/custom-job.model';

export function CanEnableFindingHandler(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'canEnableFindingHandler',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!isBoolean(value)) return false;

          const type = args.object['type'];
          if (
            !validCustomJobTypeDetails.some((cjtd) => {
              return (
                cjtd.type === type &&
                (cjtd.handlerLanguage !== undefined || value === false)
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
