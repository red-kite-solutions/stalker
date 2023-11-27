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
import { IsTypeIn } from '../../../../validators/is-type-in.validator';
import { JobTypes } from '../../jobs/job-model.module';

export class CronSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsMongoId()
  @IsOptional()
  public companyId?: string; // if companyId is not set, the subscription is for all companies

  @IsString()
  @IsNotEmpty()
  // TODO : Add cron expression validation
  // https://www.npmjs.com/package/cron-validator
  public cronExpression!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(JobTypes)
  public jobName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobParameterDto)
  @IsOptional()
  public jobParameters?: JobParameterDto[];
}

export class JobParameterDto {
  @IsString()
  public name!: string;

  @IsTypeIn(['string', 'number', 'boolean', 'array', 'object'])
  public value!: string | number | boolean | Array<any> | object;
}
