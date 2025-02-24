// import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsIP,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsProjectId } from '../../../../validators/is-project-id.validator';
import {
  resourceDetailsLevel,
  ResourceDetailsLevel,
} from '../../database.constants';
import { PagingDto } from '../../database.dto';
import { ResourceFilterDto } from '../resource.dto';

export class IpRangesFilterDto extends IntersectionType(ResourceFilterDto) {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  ips: string[];

  @IsOptional()
  @IsIP(4)
  @IsString({ each: true })
  contains: string;

  @IsOptional()
  @IsIn(resourceDetailsLevel)
  detailsLevel: ResourceDetailsLevel = 'full';
}

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

export class IpRangeDto {
  @IsIP(4)
  @IsNotEmpty()
  @IsString()
  ip: string;

  @Max(32)
  @Min(0)
  @IsNumber()
  mask: number;
}

export class SubmitIpRangesDto {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @IsArray()
  @Type(() => IpRangeDto)
  ranges: IpRangeDto[];

  @IsProjectId()
  @IsNotEmpty()
  projectId: string;
}
