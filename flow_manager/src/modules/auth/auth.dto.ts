import { IsOptional } from 'class-validator';

export class LogoutDto {
  @IsOptional()
  refresh_token: string;
}
