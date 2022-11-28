// import { Type } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

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
  page: number = 0;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number = 10;
}

export class HostsPagingDto {
  @IsNumberString()
  page: string;

  @IsNumberString()
  @Min(1)
  @Max(100)
  pageSize: string;

  @IsArray()
  @IsOptional()
  tags: Array<string>;

  @IsArray()
  @IsOptional()
  company: Array<string>;

  @IsArray()
  @IsOptional()
  domain: Array<string>;
}
