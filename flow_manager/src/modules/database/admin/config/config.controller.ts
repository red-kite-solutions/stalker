import { Body, Controller, Get, HttpException, Param, Post, ValidationPipe } from '@nestjs/common';
import { SubmitConfigDto } from './config.dto';
import { Config } from './config.model';
import { ConfigService } from './config.service';


@Controller('admin/config')
export class ConfigController {
    constructor(private readonly configService: ConfigService) {}

    @Post()
    async submitConfig(@Body(new ValidationPipe()) dto: SubmitConfigDto): Promise<void> {
        await this.configService.submitConfig(dto);
    }
}
