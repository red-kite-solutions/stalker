import { Body, Controller, Get, HttpException, Param, Post, ValidationPipe } from '@nestjs/common';
import { ReportEntryDto } from './report.dto';
import { ReportService } from './report.service';


@Controller('report/daily')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    @Post()
    async addSpecialNote(@Body(new ValidationPipe()) dto: ReportEntryDto): Promise<void> {
        await this.reportService.addSpecialNote(dto);
    }
}
