import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { ReportEntryDto, SendReportDto } from './report.dto';
import { Report } from './report.model';
import { ReportService } from './report.service';

@Controller('report/daily')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('note')
  async addComment(
    @Body(new ValidationPipe()) dto: ReportEntryDto,
  ): Promise<void> {
    await this.reportService.addComment(dto);
  }

  @Get()
  async getCurrentReport(): Promise<Report> {
    return await this.reportService.getCurrentReport();
  }

  @Post('send')
  async sendCurrentReport(
    @Body(new ValidationPipe()) dto: SendReportDto,
  ): Promise<void> {
    this.reportService.sendReport(dto.reportDate);
  }
}
