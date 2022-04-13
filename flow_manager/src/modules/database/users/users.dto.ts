import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
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
  @IsIn(['admin', 'user', 'read-only'])
  public role: string;

  @IsNotEmpty()
  @IsString()
  public currentPassword: string;
}

export class EditProfileDto {
  @IsNotEmpty()
  @IsString()
  public firstName: string;

  @IsNotEmpty()
  @IsString()
  public lastName: string;

  @IsNotEmpty()
  @IsString()
  public currentPassword: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  public newPassword: string;

  @IsNotEmpty()
  @IsString()
  public currentPassword: string;
}

export class EditUserDto {
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
  @IsBoolean()
  public active: boolean;

  @IsNotEmpty()
  @IsString()
  public currentPassword: string;
}
