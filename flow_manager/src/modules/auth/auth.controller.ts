import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { LogoutDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    const accessToken = await this.authService.createAccessToken({
      email: req.user.email,
      id: req.user._id,
      role: req.user.role,
    });
    const refreshToken: string = await this.authService.createRefreshToken(
      req.user._id,
    );
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Put('refresh')
  async refresh(@Request() req: any) {
    const accessToken = await this.authService.createAccessToken(req.user);

    return { access_token: accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  async logOut(
    @Request() request: any,
    @Body(new ValidationPipe()) dto: LogoutDto,
  ) {
    if (dto.refresh_token) {
      await this.authService.removeRefreshToken(
        request.user.id,
        dto.refresh_token,
      );
    } else {
      await this.authService.removeRefreshToken(request.user.id);
    }
  }

  // This function is left without authorizations on purpose
  // It is used to anonymously know if the platform was proerply initialized
  @Get('setup')
  async getIsSetup(): Promise<any> {
    return { isSetup: await this.authService.isAuthenticationSetup() };
  }
}
