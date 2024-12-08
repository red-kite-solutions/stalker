import { BadRequestException } from '@nestjs/common';
import {
  validateOrReject as classValidatorValidateOrReject,
  ValidatorOptions,
} from 'class-validator';

export async function validateOrReject(
  object: object,
  validatorOptions?: ValidatorOptions,
) {
  try {
    await classValidatorValidateOrReject(object, validatorOptions);
  } catch (e) {
    throw new BadRequestException(e);
  }
}
