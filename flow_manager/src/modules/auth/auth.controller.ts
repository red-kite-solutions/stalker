import {
  Controller,
  Delete,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
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
    const refreshToken: string = this.authService.createRefreshToken(
      req.user._id,
    );
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Put('refresh')
  refresh(@Request() req: any) {
    const accessToken = this.authService.createAccessToken(req.user);

    return { access_token: accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  async logOut(@Request() request: any) {
    await this.authService.removeRefreshToken(request.user.id);
  }
}
