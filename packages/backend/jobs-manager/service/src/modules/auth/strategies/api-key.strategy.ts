import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { ApiKeyDocument } from '../../database/api-key/api-key.model';
import { AuthService } from '../auth.service';
import { UserAuthContext } from '../auth.types';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'ApiKeyStrategy',
) {
  constructor(private authService: AuthService) {
    super({ header: 'x-api-key', prefix: '' }, false);
  }

  async validate(apikey: string) {
    const apiKeyDocument: ApiKeyDocument =
      await this.authService.findValidApiKey(apikey);

    if (!apiKeyDocument) throw new UnauthorizedException();

    const user: UserAuthContext = {
      id: apiKeyDocument.userId.toString(),
      apiKeyId: apiKeyDocument._id.toString(),
      scopes: apiKeyDocument.scopes,
    };

    return user;
  }
}
