import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersion(): string {
    return process.env.STALKER_VERSION;
  }
}
