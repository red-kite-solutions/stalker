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

// TODO 319: REMOVE ME
export class FilterByDomainDto {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  domains: string[];
}

export class FilterByHostDto {
  // TODO 319: REMOVE ME
  /** @deprecated : Use query instead */
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  hosts?: string[];
}

export class FilterByPortDto {
  // TODO 319: REMOVE ME
  /** @deprecated: use "query" syntax instead */
  @IsOptional()
  @IsPort({ each: true })
  @IsArray()
  ports: number[];
}

export class FilterByProjectDto {
  /** @deprecated: use "query" syntax instead */
  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  projects?: string[];
}

export class ResourceFilterDto extends IntersectionType(
  FilterByHostDto,
  FilterByProjectDto,
) {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenStartDate?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenEndDate?: number;

  @IsOptional()
  @IsString()
  query: string;

  // TODO 319: REMOVE ME
  /** @deprecated: use "query" syntax instead */
  @IsOptional()
  @IsBoolean()
  @Transform(booleanStringToBoolean)
  blocked?: boolean;

  // TODO 319: REMOVE ME
  /** @deprecated: use "query" syntax instead */
  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  tags?: string[];
}
