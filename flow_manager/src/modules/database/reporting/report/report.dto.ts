import { IsNotEmpty, IsString } from 'class-validator';

export class ReportEntryDto {
  @IsNotEmpty()
  @IsString()
  public comment: string;
}

export class SendReportDto {
  @IsNotEmpty()
  @IsString()
  public reportDate: string;
}
