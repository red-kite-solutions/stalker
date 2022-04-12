import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SubmitHostDto {
  @IsNotEmpty()
  @IsString()
  domainName: string;

  @IsNotEmpty()
  @IsArray()
  ips: string[];
}

export class SubmitHostManuallyDto {
  @IsNotEmpty()
  @IsString()
  domainName: string;

  @IsNotEmpty()
  @IsArray()
  ips: string[];

  @IsNotEmpty()
  @IsString()
  companyId: string;
}
