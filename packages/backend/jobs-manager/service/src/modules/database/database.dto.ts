import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  ResourceDetailsLevel,
  resourceDetailsLevel,
} from './database.constants';

export class PagingDto {
  @IsInt()
  @Type(() => Number)
  page: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number = 25;
}

export class ResourceDetailsLevelDto {
  @IsOptional()
  @IsIn(resourceDetailsLevel)
  detailsLevel?: ResourceDetailsLevel = 'full';
}
