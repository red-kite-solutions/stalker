import { Socket } from 'ngx-socket-io';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export class AuthenticatedSocket extends Socket {
  constructor(private authService: AuthService) {
    super({ url: environment.fmWsUrl, options: {} });
    this.ioSocket.auth = async (cb: any) => {
      if (!this.authService.isTokenValid() && !this.authService.isRefreshValid()) {
        cb({ token: null });
      }
      if (!this.authService.isTokenValid()) {
        await this.authService.refresh();
      }

      cb({ token: this.authService.token });
    };
  }
}
