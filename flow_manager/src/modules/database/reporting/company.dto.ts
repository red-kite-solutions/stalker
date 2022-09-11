import {
  IsArray,
  IsBase64,
  IsIn,
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
  @IsBase64()
  public logo: string;

  @IsOptional()
  @IsString()
  @IsIn(['png', 'jpeg', 'jpg'])
  public imageType: string;
}

export class EditCompanyDto {
  @IsOptional()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  @IsBase64()
  public logo: string;

  @IsOptional()
  @IsString()
  @IsIn(['png', 'jpeg', 'jpg'])
  public imageType: string;

  @IsOptional()
  @IsString()
  public notes: string;

  @IsOptional()
  @IsArray()
  public ipRanges: string[];
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
