import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PagingDto } from '../database.dto';
import { JobParameter } from '../subscriptions/event-subscriptions/event-subscriptions.model';
import { JobParameterDto } from '../subscriptions/subscriptions.dto';

export class JobExecutionsDto extends PagingDto {
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
