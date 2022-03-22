<<<<<<< HEAD
import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { StringStatusResponse } from 'src/utils/reponse-objects.utils';
=======
import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
>>>>>>> main
import { SubmitConfigDto } from './config.dto';
import { ConfigService } from './config.service';

<<<<<<< HEAD
@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
=======
>>>>>>> main
@Controller('admin/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

<<<<<<< HEAD
  @Put()
  async submitConfig(
    @Body(new ValidationPipe()) dto: SubmitConfigDto,
  ): Promise<StringStatusResponse> {
    try {
      await this.configService.submitConfig(dto);
      return { status: 'Success' };
    } catch (err) {
      console.log(err);
      return { status: 'Error' };
    }
  }

  @Get()
  async getConfig(): Promise<Config> {
    return await this.configService.getConfig();
=======
  @Post()
  async submitConfig(
    @Body(new ValidationPipe()) dto: SubmitConfigDto,
  ): Promise<void> {
    await this.configService.submitConfig(dto);
>>>>>>> main
  }
}
