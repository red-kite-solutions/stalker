import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public logo: string;
}
