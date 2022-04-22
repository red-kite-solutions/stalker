import { IsNotEmpty } from 'class-validator';

export class SubmitDomainDto {
  @IsNotEmpty()
  subdomains: string[];
}

export class SubmitDomainManuallyDto {
  @IsNotEmpty()
  subdomains: string[];

  @IsNotEmpty()
  companyId: string;
}
