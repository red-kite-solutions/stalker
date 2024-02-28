// import { Type } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBooleanString,
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

export class GetPortsDto {
  @IsOptional()
  @IsIn(['tcp', 'udp'])
  protocol: string = 'tcp';

  @IsNotEmpty()
  @IsIn(['full', 'summary', 'number'])
  detailsLevel: string = 'number';

  @IsNotEmpty()
  @IsIn(['popularity', 'port'])
  sortType: string = 'port';

  @IsNotEmpty()
  @IsIn(['ascending', 'descending'])
  sortOrder: string = 'ascending';

  @IsInt()
  @Min(0)
  @Type(() => Number)
  page: number = 0;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number = 10;

  @IsMongoId()
  @IsOptional()
  hostId: string;

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  host: string[];

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
  @IsBooleanString()
  blocked: 'true' | 'false';
}

export class DeleteManyPortsDto {
  @IsMongoId({ each: true })
  @IsArray()
  portIds: string[];
}
