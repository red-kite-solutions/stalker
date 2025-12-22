import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ScopedUserDocument } from '../database/users/users.model';
import { LogoutDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import JwtRefreshGuard from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { MagicLinkAuthGuard } from './guards/magic-link.guard';

interface RequestWithUser extends Request {
  user?: Partial<ScopedUserDocument>;
}

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Log in with credentials and get an access token.
   *
   * @remarks
   * Log in to the API with your local credentials. After logging in, an access token will be issued.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return await this.loginCore(req);
  }

  /**
   * Log in with unique link.
   *
   * @remarks
   * Log in to the API with your unique link. Used to reset your password.
   */
  @UseGuards(MagicLinkAuthGuard)
  @Post('login-magic-link')
  async loginMagicLink(@Request() req: RequestWithUser) {
    return await this.loginCore(req);
  }

  /**
   * Refresh your access token with your refresh token.
   *
   * @remarks
   * Use this call to get a new access token. This
   */
  @UseGuards(JwtRefreshGuard)
  @Put('refresh')
  async refresh(@Request() req: RequestWithUser) {
    const accessToken = await this.authService.createAccessToken(req.user);

    return { access_token: accessToken };
  }

  /**
   * Logout the current user.
   *
   * @remarks
   * Logout the current user, deleting their refresh token.
   */
  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  async logOut(@Request() request: RequestWithUser, @Body() dto: LogoutDto) {
    if (dto.refresh_token) {
      await this.authService.removeRefreshToken(
        request.user.id,
        dto.refresh_token,
      );
    } else {
      await this.authService.removeRefreshToken(request.user.id);
    }
  }

  /**
   * Anonymously know if the platform was properly initialized.
   *
   * @remarks
   * Anonymous API call to check if the local authentication was setup.
   */
  @Get('setup')
  async getIsSetup(): Promise<any> {
    return { isSetup: await this.authService.isAuthenticationSetup() };
  }

  private async loginCore(req: RequestWithUser) {
    const accessToken = await this.authService.createAccessToken({
      email: req.user.email,
      id: req.user._id,
      scopes: req.user.scopes,
    });
    const refreshToken: string = await this.authService.createRefreshToken(
      req.user._id.toString(),
    );
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
