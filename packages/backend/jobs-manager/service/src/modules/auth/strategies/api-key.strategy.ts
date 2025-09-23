import { Injectable } from '@nestjs/common';
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
    super(
      { header: 'x-api-key', prefix: '' },
      true,
      async (apikey, done, req) => {
        const apiKeyDocument: ApiKeyDocument =
          await authService.findValidApiKey(apikey);

        if (!apiKeyDocument) return done(null, false);

        const user: UserAuthContext = {
          id: apiKeyDocument.userId.toString(),
          apiKeyId: apiKeyDocument._id.toString(),
          scopes: apiKeyDocument.scopes,
        };

        return done(null, user);
      },
    );
  }
}
