import { Body, Controller, Get, HttpException, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiKeyGuard } from 'src/modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { SubmitHostDto } from './host.dto';
import { HostService } from './host.service';


// @Roles(Role.User)
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report/hosts')
export class HostController {
    constructor(private readonly hostService: HostService) {}


    @UseGuards(ApiKeyGuard)
    @Post(':jobId')
    async submitHosts(@Param('jobId') jobId: string, @Body(new ValidationPipe()) hosts: SubmitHostDto): Promise<void> {
        await this.hostService.addHostsToDomain(hosts, jobId);
        return;
    }
}
