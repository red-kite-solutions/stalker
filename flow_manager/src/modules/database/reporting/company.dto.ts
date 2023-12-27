import {
  IsArray,
  IsBase64,
  IsIn,
  IsNotEmpty,
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
  public logo?: string;

  @IsOptional()
  @IsString()
  @IsIn(['png', 'jpeg', 'jpg'])
  public imageType?: string;
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
