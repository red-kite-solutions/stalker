import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

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
