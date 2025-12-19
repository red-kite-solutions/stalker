import { IntersectionType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
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
  portIds: string[];

  @IsOptional()
  @IsBoolean()
  block: boolean;
}
