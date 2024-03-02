import { Type } from 'class-transformer';
import { Equals, IsBoolean, IsIn, IsString } from 'class-validator';
import { IsTypeIn } from '../../../validators/is-type-in.validator';

const conditionOperators = [
  'equals',
  'gte',
  'gt',
  'lte',
  'lt',
  'contains',
  'contains_i',
  'startsWith',
  'startsWith_i',
  'endsWith',
  'endsWith_i',
  'equals_i',
].flatMap((v) => [v, `not_${v}`]);

export class JobConditionDto {
  @IsTypeIn(['string', 'number', 'boolean'])
  public lhs!: string | number | boolean;

  @IsString()
  @IsIn(conditionOperators)
  public operator: string;

  @IsTypeIn(['string', 'number', 'boolean'])
  public rhs!: string | number | boolean;
}

export class JobParameterDto {
  @IsString()
  public name!: string;

  @IsTypeIn(['string', 'number', 'boolean', 'array', 'object'])
  public value!: string | number | boolean | Array<any> | object;
}

export class PatchSubscriptionDto {
  @Equals(true)
  @IsBoolean()
  @Type(() => Boolean)
  revert: boolean;
}
