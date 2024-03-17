import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { JobParameter } from '../subscriptions/event-subscriptions/event-subscriptions.model';
import { JobParameterDto } from '../subscriptions/subscriptions.dto';

export class JobExecutionsDto {
  @IsNumberString()
  page: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: string;

  @IsMongoId()
  @IsOptional()
  project: string;
}

export class StartJobDto {
  /**
   * TODO: make a proper validator instead of validating in controller
   */
  @IsNotEmpty()
  @IsString()
  public task!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobParameterDto)
  @IsOptional()
  public jobParameters!: JobParameter[];

  @IsMongoId()
  @IsOptional()
  projectId?: string;
}
