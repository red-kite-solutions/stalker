// import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class DomainsPagingDto {
  @IsNumberString()
  page: string;

  @IsNumberString()
  @IsIn(['10', '25', '50', '100'])
  pageSize: string;

  @IsArray()
  @IsOptional()
  domain: Array<string>;

  @IsArray()
  @IsOptional()
  tags: Array<string>;

  @IsMongoId()
  @IsOptional()
  company: string;
}

export class GetDomainCountDto {
  @IsArray()
  @IsOptional()
  domain: Array<string>;

  @IsArray()
  @IsOptional()
  tags: Array<string>;

  @IsMongoId()
  @IsOptional()
  company: string;
}

export class EditDomainDto {
  @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => Types.ObjectId)
  tags: Types.ObjectId[];
}
