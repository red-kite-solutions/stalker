import { Body, Controller, Get, HttpException, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { SendSimpleAlertDto } from './keybase.dto';
import { KeybaseService } from './keybase.service';

@Roles(Role.User)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alert/keybase')
export class KeybaseController {
    constructor(private readonly keybaseService: KeybaseService) {}

    @Post()
    async sendSimpleAlert(@Body(new ValidationPipe()) dto: SendSimpleAlertDto): Promise<void> {
        await this.keybaseService.sendSimpleAlert(dto);
    }
}
