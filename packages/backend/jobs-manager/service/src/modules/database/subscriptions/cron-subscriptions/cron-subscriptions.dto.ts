import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CustomJobNameExists } from '../../../../validators/custom-job-name-exists.validator';
import { IsCronExpression } from '../../../../validators/is-cron-expression.validator';
import { IsValidJobConditionsArray } from '../../../../validators/is-valid-job-conditions-array.validator';
import {
  AndJobCondition,
  JobCondition,
  OrJobCondition,
} from '../event-subscriptions/event-subscriptions.model';
import { JobParameterDto } from '../subscriptions.dto';
import { InputSource, inputSources } from './cron-subscriptions.model';

export class CronSubscriptionDto {
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

  @IsValidJobConditionsArray()
  @IsOptional()
  public conditions?: Array<JobCondition | OrJobCondition | AndJobCondition>;
}
