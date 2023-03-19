import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsTypeIn } from '../../../validators/is-type-in.validator';
import { JobTypes } from '../jobs/job-model.module';

export class SubscriptionDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsMongoId()
  @IsNotEmpty()
  public companyId!: string;

  @IsString()
  @IsNotEmpty()
  public finding!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(JobTypes)
  public jobName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobParameterDto)
  @IsOptional()
  public jobParameters?: JobParameterDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobConditionDto)
  @IsOptional()
  public conditions?: JobConditionDto[];
}

export class JobParameterDto {
  @IsString()
  public name!: string;

  @IsTypeIn(['string', 'number', 'boolean', 'array', 'object'])
  public value!: string | number | boolean | Array<any> | object;
}

class JobConditionDto {
  @IsTypeIn(['string', 'number', 'boolean'])
  public lhs!: string | number | boolean;

  @IsString()
  @IsIn([
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
  ])
  public operator: string;

  @IsTypeIn(['string', 'number', 'boolean'])
  public rhs!: string | number | boolean;
}
