import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class SubmitDomainDto {
  @IsNotEmpty()
  @IsArray()
  subdomains: string[];
}

export class SubmitDomainManuallyDto {
  @IsNotEmpty()
  @IsArray()
  subdomains: string[];

  @IsNotEmpty()
  @IsMongoId()
  companyId: string;
}

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
