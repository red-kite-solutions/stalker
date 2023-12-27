import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { JobParameterDto } from '../subscriptions/event-subscriptions/event-subscriptions.dto';
import { JobParameter } from '../subscriptions/event-subscriptions/event-subscriptions.model';
import { JobSources, JobTypes } from './job-model.module';

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
  company: string;
}

export class StartJobDto {
  /**
   * The whole validation will be skipped when ValidateIf returns
   * false. The string checks must be done in the code, in that case
   */
  @ValidateIf((o) => o.source !== JobSources.userCreated)
  @IsIn(JobTypes)
  @IsNotEmpty()
  @IsString()
  public task!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobParameterDto)
  @IsOptional()
  public jobParameters!: JobParameter[];

  @IsIn(JobSources.all)
  @IsNotEmpty()
  @IsString()
  public source!: string;

  @IsMongoId()
  @IsOptional()
  companyId?: string;
}
