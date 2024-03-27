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
import { JobConditionDto, JobParameterDto } from '../subscriptions.dto';

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
