import { Body, Controller, Get, HttpException, Param, Post, ValidationPipe } from '@nestjs/common';
import { CreateProgramDto } from './program.dto';
import { ProgramService } from './program.service';


@Controller('report/program')
export class ProgramController {
    constructor(private readonly programService: ProgramService) {}

    @Post()
    async createProgram(@Body(new ValidationPipe()) dto: CreateProgramDto): Promise<void> {
        await this.programService.addProgram(dto);
    }
}
