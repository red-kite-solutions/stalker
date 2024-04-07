import { Equals, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { IsTypeIn } from '../../../validators/is-type-in.validator';
import { SubscriptionsUtils } from './subscriptions.utils';

export class JobConditionDto {
  @IsTypeIn(['string', 'number', 'boolean'])
  public lhs!: string | number | boolean;

  @IsString()
  @IsIn(SubscriptionsUtils.conditionOperators)
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
  @IsOptional()
  revert?: boolean;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
