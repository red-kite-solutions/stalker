import { Injectable } from '@nestjs/common';
import {
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CustomJobsService } from '../modules/database/custom-jobs/custom-jobs.service';

@ValidatorConstraint({ name: 'CustomJobNameExists', async: true })
@Injectable()
export class CustomJobNameExistsRule implements ValidatorConstraintInterface {
  constructor(private customJobService: CustomJobsService) {}

  async validate(value: any) {
    if (!isString(value)) return false;
    const cj = await this.customJobService.getByName(value);

    if (!cj) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Custom job name does not exist`;
  }
}

/**
 * Validates that the custom job name exists in the database
 * @param validationOptions
 * @returns
 */
export function CustomJobNameExists(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'CustomJobNameExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CustomJobNameExistsRule,
    });
  };
}
