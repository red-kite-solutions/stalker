// import { Type } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumberString,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { MongoIdDto } from '../../../../types/dto/MongoIdDto';

export class TopPortsDto extends MongoIdDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  top: number;
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
