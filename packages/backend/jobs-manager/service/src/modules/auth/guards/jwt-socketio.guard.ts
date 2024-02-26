import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtSocketioGuard extends AuthGuard('jwt-socketio') {
  constructor() {
    super();
  }

  getRequest(context: ExecutionContext) {
    return context.switchToWs().getClient().handshake;
  }
}
