import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

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

export const sortDirections = ['ascending', 'descending'] as const;
export type SortDirection = (typeof sortDirections)[number];

export class SortDto {
  @IsIn(sortDirections)
  @IsOptional()
  sort?: SortDirection;
}
