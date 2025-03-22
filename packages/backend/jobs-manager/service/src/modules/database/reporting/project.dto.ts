import {
  IsBase64,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProjectDto {
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

export class EditProjectDto {
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
}
