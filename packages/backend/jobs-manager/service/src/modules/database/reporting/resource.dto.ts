import { IntersectionType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsPort,
  IsString,
} from 'class-validator';
import { booleanStringToBoolean } from '../../../utils/boolean-string-to-boolean';
import { IsIpRange } from '../../../validators/is-ip-range.validator';

export class FilterByDomainDto {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  domains?: string[];
}

export class FilterByHostDto {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  hosts?: string[];
}

export class FilterByIpRangeDto {
  @IsOptional()
  @IsIpRange({ each: true })
  @IsArray()
  ranges?: string[];
}

export class FilterByPortDto {
  @IsOptional()
  @IsPort({ each: true })
  @IsArray()
  ports?: number[];
}

export class FilterByProjectDto {
  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  projects?: string[];
}

export class ResourceFilterDto extends IntersectionType(FilterByProjectDto) {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenStartDate?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenEndDate?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanStringToBoolean)
  blocked?: boolean;

  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  tags?: string[];
}
