// import { Type } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPort,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DetailsLevel, detailsLevel } from '../../database.constants';

export class GetPortsDto {
  @IsOptional()
  @IsIn(['tcp', 'udp'])
  protocol: string = 'tcp';

  @IsNotEmpty()
  @IsIn(detailsLevel)
  detailsLevel: DetailsLevel = 'full';

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
  host: string[];

  @IsOptional()
  @IsMongoId()
  hostId: string;

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
}

export class DeleteManyPortsDto {
  @IsMongoId({ each: true })
  @IsArray()
  portIds: string[];
}
