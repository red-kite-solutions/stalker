import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { JobTypes } from '../../jobs/job-model.module';
import { JobConditionDto, JobParameterDto } from '../subscriptions.dto';

export class EventSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsMongoId()
  @IsOptional()
  public companyId?: string; // if companyId is not set, the subscription is for all companies

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

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  public cooldown: number;
}
