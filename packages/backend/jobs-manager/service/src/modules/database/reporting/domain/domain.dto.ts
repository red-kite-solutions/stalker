import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsBooleanString,
  IsFQDN,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Types } from 'mongoose';

export class DomainsPagingDto {
  @IsInt()
  @Type(() => Number)
  page: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number;

  @IsArray()
  @IsOptional()
  domain: Array<string>;

  @IsArray()
  @IsOptional()
  host: Array<string>;

  @IsArray()
  @IsOptional()
  tags: Array<string>;

  @ValidateIf((dto) => dto.project !== '')
  @IsMongoId()
  @IsOptional()
  project: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenStartDate: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  firstSeenEndDate: number;

  @IsOptional()
  @IsBooleanString()
  blocked: 'true' | 'false';
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
  projectId: string;
}

export class BatchEditDomainsDto {
  @IsArray()
  @IsMongoId({ each: true })
  domainIds: Types.ObjectId[];

  @IsOptional()
  @IsBoolean()
  block: boolean;
}
