import { IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { booleanStringToBoolean } from '../../../../utils/boolean-string-to-boolean';
import { PagingDto } from '../../database.dto';
import {
  FilterByDomainDto,
  FilterByHostDto,
  FilterByPortDto,
  ResourceFilterDto,
} from '../resource.dto';

export class WebsiteFilterDto extends IntersectionType(
  ResourceFilterDto,
  FilterByPortDto,
  FilterByDomainDto,
  FilterByHostDto,
) {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  paths: string[];

  @IsOptional()
  @IsMongoId()
  mergedInId: string;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanStringToBoolean)
  merged: boolean;
}

export class GetWebsitesDto extends IntersectionType(
  PagingDto,
  WebsiteFilterDto,
) {}

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

export class MergeWebsitesDto {
  @IsMongoId()
  mergeInto: string;

  @IsMongoId({ each: true })
  @IsArray()
  mergeFrom: string[];
}

export class UnmergeWebsitesDto {
  @IsMongoId({ each: true })
  @IsArray()
  unmerge: string[];
}
