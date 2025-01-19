import { IntersectionType } from '@nestjs/swagger';
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
import { FilterByProjectDto } from '../reporting/resource.dto';
import { JobParameterDto } from '../subscriptions/subscriptions.dto';
import { JobParameter } from '../subscriptions/subscriptions.type';

export class JobExecutionsDto extends IntersectionType(
  PagingDto,
  FilterByProjectDto,
) {
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
