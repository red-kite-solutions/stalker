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
import { IsCronExpression } from '../../../../validators/is-cron-expression.validator';
import { JobTypes } from '../../jobs/job-model.module';
import { JobConditionDto, JobParameterDto } from '../subscriptions.dto';
import { InputSource } from './cron-subscriptions.model';

export class CronSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsMongoId()
  @IsOptional()
  public companyId?: string; // if companyId is not set, the subscription is for all companies

  @IsString()
  @IsNotEmpty()
  @IsCronExpression()
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

  @IsIn(['ALL_DOMAINS', 'ALL_HOSTS', 'ALL_TCP_PORTS'])
  @IsOptional()
  public input?: InputSource;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobConditionDto)
  @IsOptional()
  public conditions?: JobConditionDto[];
}
