import { Type } from 'class-transformer';
import {
  IsArray,
  IsBase64,
  IsFQDN,
  IsIn,
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { JobSources, JobTypes } from '../jobs/job-model.module';
import { JobParameterDto } from '../subscriptions/subscriptions.dto';
import { JobParameter } from '../subscriptions/subscriptions.model';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  @IsBase64()
  public logo?: string;

  @IsOptional()
  @IsString()
  @IsIn(['png', 'jpeg', 'jpg'])
  public imageType?: string;
}

export class EditCompanyDto {
  @IsOptional()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  @IsBase64()
  public logo: string;

  @IsOptional()
  @IsString()
  @IsIn(['png', 'jpeg', 'jpg'])
  public imageType: string;

  @IsOptional()
  @IsString()
  public notes: string;

  @IsOptional()
  @IsArray()
  public ipRanges: string[];
}

export class SubmitDomainsDto {
  @IsNotEmpty()
  @IsArray()
  @IsFQDN({}, { each: true })
  domains: string[];
}

export class SubmitHostsDto {
  @IsNotEmpty()
  @IsArray()
  @IsIP('4', { each: true })
  ips: string[];
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
}
