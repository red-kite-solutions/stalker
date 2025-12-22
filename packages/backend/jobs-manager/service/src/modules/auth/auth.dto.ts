import { IsOptional } from 'class-validator';

export class LogoutDto {
  @IsOptional()
  refresh_token: string;
}

export class LocalAuthDto {
  email: string;
  password: string;
}
