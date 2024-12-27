// import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIP,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPort,
} from 'class-validator';
import { Types } from 'mongoose';
import { PagingDto } from '../../database.dto';
import { FilterByDomainDto, ResourceFilterDto } from '../resource.dto';

export class HostsFilterDto extends IntersectionType(
  ResourceFilterDto,
  FilterByDomainDto,
) {}

export class HostsPagingDto extends IntersectionType(
  PagingDto,
  HostsFilterDto,
) {}

export class DeleteHostsDto {
  @IsArray()
  @IsMongoId({ each: true })
  hostIds: Types.ObjectId[];
}

export class SubmitHostsDto {
  @IsNotEmpty()
  @IsArray()
  @IsIP('4', { each: true })
  ips: string[];

  @IsMongoId()
  projectId: string;
}

export class BatchEditHostsDto {
  @IsArray()
  @IsMongoId({ each: true })
  hostIds: string[];

  @IsOptional()
  @IsBoolean()
  block: boolean;
}

export class GetHostPortDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @IsPort()
  @IsNotEmpty()
  portNumber: number;
}
