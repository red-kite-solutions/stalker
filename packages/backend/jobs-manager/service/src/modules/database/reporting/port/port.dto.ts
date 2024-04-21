// import { Type } from 'class-transformer';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
import { Types } from 'mongoose';
import { booleanStringToBoolean } from '../../../../utils/boolean-string-to-boolean';
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

  @IsOptional()
  @IsBoolean()
  @Transform(booleanStringToBoolean)
  blocked: boolean;
}

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
