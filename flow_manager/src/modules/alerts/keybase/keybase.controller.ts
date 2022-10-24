import {
  Body,
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { SendSimpleAlertDto } from './keybase.dto';
import { KeybaseService } from './keybase.service';

@Roles(Role.User)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alert/keybase')
export class KeybaseController {
  constructor(private readonly keybaseService: KeybaseService) {}

  @Post()
  async sendSimpleAlert(
    @Body(new ValidationPipe()) dto: SendSimpleAlertDto,
  ): Promise<void> {
    await this.keybaseService.sendSimpleAlert(dto);
  }
}
