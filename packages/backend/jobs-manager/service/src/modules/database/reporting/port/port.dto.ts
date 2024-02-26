// import { Type } from 'class-transformer';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsNotEmpty, Max, Min } from 'class-validator';

export class GetPortsDto {
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
  page: number = 0;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  pageSize: number = 10;

  @IsMongoId()
  hostId: string;
}
