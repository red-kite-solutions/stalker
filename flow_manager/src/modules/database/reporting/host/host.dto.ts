import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class PortsDto {
  @IsNotEmpty()
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
  page: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number = 10;
}
