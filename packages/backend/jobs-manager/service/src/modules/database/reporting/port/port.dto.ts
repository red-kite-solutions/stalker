// import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { PortDetailsLevel, portDetailsLevel } from '../../database.constants';
import { PagingDto } from '../../database.dto';
import {
  FilterByHostDto,
  FilterByPortDto,
  ResourceFilterDto,
} from '../resource.dto';

export class PortFilterDto extends IntersectionType(
  ResourceFilterDto,
  FilterByPortDto,
  FilterByHostDto,
) {
  @IsOptional()
  @IsIn(['tcp', 'udp'])
  protocol: string = 'tcp';

  @IsNotEmpty()
  @IsIn(portDetailsLevel)
  detailsLevel: PortDetailsLevel = 'full';

  /** @deprecated : Use query instead */
  @IsOptional()
  @IsMongoId()
  hostId: string;

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  services: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  products: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  versions: string[];
}

export class GetPortsDto extends IntersectionType(PagingDto, PortFilterDto) {}

export class DeleteManyPortsDto {
  @IsMongoId({ each: true })
  @IsArray()
  portIds: string[];
}

export class BatchEditPortsDto {
  @IsArray()
  @IsMongoId({ each: true })
  portIds: Types.ObjectId[];

  @IsOptional()
  @IsBoolean()
  block: boolean;
}
