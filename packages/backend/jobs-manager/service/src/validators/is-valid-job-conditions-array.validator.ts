import {
  isArray,
  isIn,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { SubscriptionsUtils } from '../modules/database/subscriptions/subscriptions.utils';
import { isTypeIn } from './is-type-in.validator';

export function IsValidJobConditionsArray(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidJobConditionsArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(values: any) {
          return isValidJobConditionsArray(values);
        },
      },
    });
  };
}

export function isValidConditionOperator(operator: any) {
  if (typeof operator !== 'string') return false;

  if (operator.endsWith('_i')) {
    operator = operator.substring(0, operator.length - 2);
  }

  while (operator.startsWith('not_') || operator.startsWith('or_')) {
    if (operator.startsWith('not_')) {
      operator = operator.substring(4);
    }
    if (operator.startsWith('or_')) {
      operator = operator.substring(3);
    }
  }

  return isIn(operator, SubscriptionsUtils.conditionOperators);
}

export function isValidJobConditionsArray(values: any) {
  const validateRecursive = (values: any) => {
    if (!isArray(values)) {
      return false;
    }

    let allValid = true;
    for (const condition of values) {
      const keys = Object.keys(condition);

      if (keys.length !== 1 && keys.length !== 3) {
        return false;
      }

      // 'or' or 'and'
      if (keys.length === 1) {
        if (keys[0] === 'or' || keys[0] === 'and') {
          allValid = allValid && validateRecursive(condition[keys[0]]);
        } else {
          return false;
        }
      } else {
        let validKeys = ['lhs', 'operator', 'rhs'];
        for (let key of keys) {
          if (validKeys.find((k) => k === key)) {
            validKeys = validKeys.filter((k) => k !== key);

            if (key === 'lhs' || key === 'rhs') {
              allValid =
                allValid &&
                isTypeIn(condition[key], [
                  'array',
                  'string',
                  'number',
                  'boolean',
                ]);
            } else {
              // operator
              allValid = allValid && isValidConditionOperator(condition[key]);
            }
          } else {
            return false;
          }
        }
      }

      if (!allValid) {
        return false;
      }
    }

    return allValid;
  };

  return validateRecursive(values);
}
