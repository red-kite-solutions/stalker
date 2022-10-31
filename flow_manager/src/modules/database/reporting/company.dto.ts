import {
  IsArray,
  IsBase64,
  IsFQDN,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsIPv4 } from 'src/validators/ipv4.validator';

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
  @IsFQDN({}, { each: true })
  domains: string[];
}

export class SubmitHostsDto {
  @IsNotEmpty()
  @IsArray()
  @IsIPv4({ each: true })
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
