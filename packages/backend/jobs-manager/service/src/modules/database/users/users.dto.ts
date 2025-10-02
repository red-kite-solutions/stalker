import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public firstName: string;

  @IsNotEmpty()
  @IsString()
  public lastName: string;

  @IsNotEmpty()
  @IsString()
  @Length(12)
  public password: string;

  @IsNotEmpty()
  @IsBoolean()
  public active: boolean;

  @IsNotEmpty()
  @IsString()
  public currentPassword: string;
}

export class CreateFirstUserDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public firstName: string;

  @IsNotEmpty()
  @IsString()
  public lastName: string;

  @IsNotEmpty()
  @IsString()
  @Length(12)
  public password: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  public newPassword: string;

  @IsOptional()
  @IsString()
  public currentPassword?: string;
}

export class EditUserDto {
  @IsOptional()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  public firstName: string;

  @IsNotEmpty()
  @IsString()
  public lastName: string;

  @IsOptional()
  @IsBoolean()
  public active: boolean;

  @IsNotEmpty()
  @IsString()
  public currentPassword: string;
}
