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
import { CustomJobNameExists } from '../../../../validators/custom-job-name-exists.validator';
import { IsCronExpression } from '../../../../validators/is-cron-expression.validator';
import { JobConditionDto, JobParameterDto } from '../subscriptions.dto';
import { InputSource, inputSources } from './cron-subscriptions.model';

export class CronSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsMongoId()
  @IsOptional()
  public projectId?: string; // if projectId is not set, the subscription is for all projects

  @IsString()
  @IsNotEmpty()
  @IsCronExpression()
  public cronExpression!: string;

  @IsString()
  @IsNotEmpty()
  @CustomJobNameExists()
  public jobName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobParameterDto)
  @IsOptional()
  public jobParameters?: JobParameterDto[];

  @IsIn(inputSources)
  @IsOptional()
  public input?: InputSource;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobConditionDto)
  @IsOptional()
  public conditions?: JobConditionDto[];
}
