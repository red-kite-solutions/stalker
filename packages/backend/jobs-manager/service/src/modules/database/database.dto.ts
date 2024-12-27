import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

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
