import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CustomJobNameExists } from '../../../validators/custom-job-name-exists.validator';
import { IsTypeIn } from '../../../validators/is-type-in.validator';
import { IsValidJobConditionsArray } from '../../../validators/is-valid-job-conditions-array.validator';
import {
  AndJobCondition,
  JobCondition,
  OrJobCondition,
} from './subscriptions.type';

export class DuplicateSubscriptionDto {
  @IsMongoId()
  @IsNotEmpty()
  @IsString()
  public subscriptionId: string;
}

export class JobParameterDto {
  @IsString()
  public name!: string;

  @IsTypeIn(['string', 'number', 'boolean', 'array', 'object'])
  public value!: string | number | boolean | Array<any> | object;
}

export class PatchSubscriptionDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class BaseSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsBoolean()
  @IsOptional()
  public isEnabled?: boolean;

  @IsMongoId()
  @IsOptional()
  public projectId?: string; // if projectId is not set, the subscription is for all projects

  @IsString()
  @IsNotEmpty()
  @CustomJobNameExists()
  public jobName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobParameterDto)
  @IsOptional()
  public jobParameters?: JobParameterDto[];

  @IsValidJobConditionsArray()
  @IsOptional()
  public conditions?: Array<JobCondition | OrJobCondition | AndJobCondition>;
}
