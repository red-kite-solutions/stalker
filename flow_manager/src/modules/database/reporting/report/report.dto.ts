import { IsNotEmpty, IsString } from 'class-validator';

export class ReportEntryDto {
  @IsNotEmpty()
  @IsString()
  public noteContent: string;

  // @IsNotEmpty()
  // @IsString()
  // public channel: string
}

export class SendReportDto {
  @IsNotEmpty()
  @IsString()
  public reportDate: string;
}
