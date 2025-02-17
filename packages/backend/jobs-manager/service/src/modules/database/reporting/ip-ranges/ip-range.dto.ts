// import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { PagingDto } from '../../database.dto';
import { ResourceFilterDto } from '../resource.dto';

export class IpRangesFilterDto extends IntersectionType(ResourceFilterDto) {}

export class IpRangesPagingDto extends IntersectionType(
  PagingDto,
  IpRangesFilterDto,
) {}

export class DeleteIpRangesDto {
  @IsArray()
  @IsMongoId({ each: true })
  ipRangeIds: string[];
}

export class BatchEditIpRangesDto {
  @IsArray()
  @IsMongoId({ each: true })
  ipRangeIds: string[];

  @IsOptional()
  @IsBoolean()
  block: boolean;
}
