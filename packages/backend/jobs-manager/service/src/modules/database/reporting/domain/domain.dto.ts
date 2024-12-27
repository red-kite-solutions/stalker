import { IntersectionType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsFQDN,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';
import { PagingDto } from '../../database.dto';
import { FilterByDomainDto, ResourceFilterDto } from '../resource.dto';

export class DomainFilterDto extends IntersectionType(
  ResourceFilterDto,
  FilterByDomainDto,
) {}

export class DomainsPagingDto extends IntersectionType(
  PagingDto,
  DomainFilterDto,
) {}

export class EditDomainDto {
  @IsArray()
  tags: Types.ObjectId[];
}

export class DeleteDomainsDto {
  @IsMongoId({ each: true })
  @IsArray()
  domainIds: Types.ObjectId[];
}

export class SubmitDomainsDto {
  @IsNotEmpty()
  @IsArray()
  @IsFQDN({}, { each: true })
  domains: string[];

  @IsMongoId()
  projectId: string;
}

export class BatchEditDomainsDto {
  @IsArray()
  @IsMongoId({ each: true })
  domainIds: Types.ObjectId[];

  @IsOptional()
  @IsBoolean()
  block: boolean;
}
