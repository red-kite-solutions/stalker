import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SubmitConfigDto {
  @IsOptional()
  @IsBoolean()
  public isNewContentReported: boolean;

  @IsOptional()
  @IsBoolean()
  public keybaseConfigEnabled: boolean;

  @IsOptional()
  @IsString()
  keybaseConfigUsername: string;

  @IsOptional()
  @IsString()
  keybaseConfigPaperkey: string;

  @IsOptional()
  @IsString()
  keybaseConfigChannelId: string;
}
