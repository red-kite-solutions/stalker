import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiKeyGuard extends AuthGuard('ApiKeyStrategy') {
  constructor() {
    super();
  }
}
