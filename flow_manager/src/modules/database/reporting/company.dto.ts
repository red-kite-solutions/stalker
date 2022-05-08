import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public logo: string;
}

export class SubmitDomainsDto {
  @IsNotEmpty()
  @IsArray()
  domains: string[];
}

export class SubmitHostDto {
  @IsNotEmpty()
  @IsString()
  domainName: string;

  @IsNotEmpty()
  @IsArray()
  ips: string[];
}

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  public task!: string;

  @IsNotEmpty()
  @IsNumber()
  public priority!: number;
}
