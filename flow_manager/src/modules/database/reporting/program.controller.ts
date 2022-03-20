import { Body, Controller, Get, HttpException, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { CreateProgramDto } from './program.dto';
import { ProgramService } from './program.service';


@Roles(Role.User)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report/program')
export class ProgramController {
    constructor(private readonly programService: ProgramService) {}

    @Post()
    async createProgram(@Body(new ValidationPipe()) dto: CreateProgramDto): Promise<void> {
        await this.programService.addProgram(dto);
    }
}
