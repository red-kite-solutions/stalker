import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { ReportEntryDto, SendReportDto } from './report.dto';
import { Report } from './report.model';
import { ReportService } from './report.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Roles(Role.User)
  @Post('comment')
  async addComment(
    @Body(new ValidationPipe()) dto: ReportEntryDto,
  ): Promise<void> {
    await this.reportService.addComment(dto);
  }

  @Roles(Role.ReadOnly)
  @Get()
  async getCurrentReport(): Promise<Report> {
    return await this.reportService.getCurrentReport();
  }

  @Roles(Role.User)
  @Post('send')
  async sendCurrentReport(
    @Body(new ValidationPipe()) dto: SendReportDto,
  ): Promise<void> {
    this.reportService.sendReport(dto.reportDate);
  }
}
