import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsPort,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';
import { booleanStringToBoolean } from '../../../../utils/boolean-string-to-boolean';

export class GetWebsitesDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  page: number = 0;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number = 10;

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  hosts: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  domains: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  paths: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  project: string[];

  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  tags: string[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenStartDate: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenEndDate: number;

  @IsOptional()
  @IsPort({ each: true })
  @IsArray()
  ports: number[];

  @IsOptional()
  @IsBoolean()
  @Transform(booleanStringToBoolean)
  blocked: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanStringToBoolean)
  merged: boolean;
}

export class DeleteManyWebsitesDto {
  @IsMongoId({ each: true })
  @IsArray()
  websiteIds: string[];
}

export class BatchEditWebsitesDto {
  @IsArray()
  @IsMongoId({ each: true })
  websiteIds: Types.ObjectId[];

  @IsOptional()
  @IsBoolean()
  block: boolean;
}
