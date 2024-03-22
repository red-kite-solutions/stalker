// import { Type } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsBooleanString,
  IsIP,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class HostsFilterDto {
  @IsInt()
  @Type(() => Number)
  page: number = 0;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number = 10;

  @IsOptional()
  @IsMongoId({ each: true })
  @Type(() => Array)
  tags: string[];

  @IsArray()
  @IsOptional()
  project: string[];

  @IsArray()
  @IsOptional()
  domain: string[];

  @IsArray()
  @IsOptional()
  host: string[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenStartDate: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenEndDate: number;

  @IsOptional()
  @IsBooleanString()
  blocked: 'true' | 'false';
}

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
