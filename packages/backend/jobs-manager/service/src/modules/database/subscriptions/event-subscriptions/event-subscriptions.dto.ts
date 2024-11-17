import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomJobNameExists } from '../../../../validators/custom-job-name-exists.validator';
import { IsValidJobConditionsArray } from '../../../../validators/is-valid-job-conditions-array.validator';
import { JobParameterDto } from '../subscriptions.dto';
import {
  AndJobCondition,
  JobCondition,
  OrJobCondition,
} from './event-subscriptions.model';

export class DuplicateEventSubscriptionDto {
  @IsMongoId()
  @IsNotEmpty()
  @IsString()
  public subscriptionId: string;
}

export class EventSubscriptionDto {
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
  public finding!: string;

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

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  public cooldown: number;

  @IsOptional()
  @IsString()
  public discriminator?: string;
}
