import { IsNotEmpty } from 'class-validator';

export class SubmitSubdomainDto {
  @IsNotEmpty()
  subdomains: string[];
}

export class SubmitSubdomainManuallyDto {
  @IsNotEmpty()
  subdomains: string[];

  @IsNotEmpty()
  program: string;
}
