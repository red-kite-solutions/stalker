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

export class FilterByDomainDto {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  domain: string[];
}

export class FilterByHostDto {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  host: string[];
}

export class FilterByPortDto {
  @IsOptional()
  @IsPort({ each: true })
  @IsArray()
  port: number[];
}

export class ResourceFilterDto extends FilterByHostDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenStartDate: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenEndDate: number;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanStringToBoolean)
  blocked: boolean;

  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  tags: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  project: string[];
}
