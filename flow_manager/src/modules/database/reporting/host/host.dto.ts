// import { Type } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
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
  @IsIn(['10', '25', '50', '100'])
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

export class GetHostCountDto {
  @IsArray()
  @IsOptional()
  domain: string;

  @IsArray()
  @IsOptional()
  tags: Array<string>;

  @IsMongoId()
  @IsOptional()
  company: string;
}
