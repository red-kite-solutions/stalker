import { Type } from 'class-transformer';
import {
  IsArray,
  IsFQDN,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Types } from 'mongoose';

export class DomainsPagingDto {
  @IsNumberString()
  page: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: string;

  @IsArray()
  @IsOptional()
  domain: Array<string>;

  @IsArray()
  @IsOptional()
  host: Array<string>;

  @IsArray()
  @IsOptional()
  tags: Array<string>;

  @ValidateIf((dto) => dto.company !== '')
  @IsMongoId()
  @IsOptional()
  company: string;
}

export class EditDomainDto {
  @IsArray()
  tags: Types.ObjectId[];
}

export class DeleteDomainsDto {
  @IsMongoId({ each: true })
  @IsArray()
  domainIds: Types.ObjectId[];
}

export class SubmitDomainsDto {
  @IsNotEmpty()
  @IsArray()
  @IsFQDN({}, { each: true })
  domains: string[];

  @IsMongoId()
  companyId: string;
}
