// import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';
import { DetailsLevel, detailsLevel } from '../../database.constants';
import { PagingDto } from '../../database.dto';
import { FilterByPortDto, ResourceFilterDto } from '../resource.dto';

export class PortFilterDto extends IntersectionType(
  ResourceFilterDto,
  FilterByPortDto,
) {
  @IsOptional()
  @IsIn(['tcp', 'udp'])
  protocol: string = 'tcp';

  @IsNotEmpty()
  @IsIn(detailsLevel)
  detailsLevel: DetailsLevel = 'full';

  @IsOptional()
  @IsMongoId()
  hostId: string;
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
