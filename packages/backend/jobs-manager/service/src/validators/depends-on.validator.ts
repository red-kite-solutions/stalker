import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function DependsOn(
  propertyName: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, variableName: string) {
    registerDecorator({
      name: 'dependsOn',
      target: object.constructor,
      propertyName: variableName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const property = args.object[propertyName];
          if (property === undefined || property == null) return false;
          return true;
        },
      },
    });
  };
}
