import { Equals, IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsTypeIn } from '../../../validators/is-type-in.validator';

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
