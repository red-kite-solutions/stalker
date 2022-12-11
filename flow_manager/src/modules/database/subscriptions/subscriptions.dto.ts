import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsTypeIn } from '../../../validators/isTypeIn.validator';
import { FindingTypes } from '../../findings/findings.service';
import { JobTypes } from '../jobs/job-model.module';

export class SubscriptionDto {
  @IsString()
  public name!: string;

  @IsMongoId()
  public companyId!: string;

  @IsString()
  @IsIn(FindingTypes)
  public finding!: string;

  @IsString()
  @IsIn(JobTypes)
  public jobName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobParameterDto)
  @IsOptional()
  public jobParameters: JobParameterDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobConditionDto)
  @IsOptional()
  public conditions: JobConditionDto[];
}

class JobParameterDto {
  @IsString()
  public name!: string;

  @IsTypeIn(['string', 'number', 'boolean'])
  public value!: string | number | boolean;
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
    'matches',
    'matches_i',
  ])
  public operator: string;

  @IsTypeIn(['string', 'number', 'boolean'])
  public rhs!: string | number | boolean;
}
