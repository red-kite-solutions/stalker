import { Body, Controller, Get, HttpException, Param, Post, ValidationPipe } from '@nestjs/common';
import { SendSimpleAlertDto } from './keybase.dto';
import { KeybaseService } from './keybase.service';


@Controller('alert/keybase')
export class KeybaseController {
    constructor(private readonly keybaseService: KeybaseService) {}

    @Post()
    async sendSimpleAlert(@Body(new ValidationPipe()) dto: SendSimpleAlertDto): Promise<void> {
        await this.keybaseService.sendSimpleAlert(dto);
    }
}
