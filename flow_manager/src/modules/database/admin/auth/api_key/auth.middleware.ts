import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const clientKey = req.header('API_KEY');

    if (clientKey) {
      if (clientKey !== process.env.API_KEY) {
        throw new UnauthorizedException(
          'API_KEY header contained an invalid API key.',
        );
      }
    } else {
      throw new UnauthorizedException(
        'API_KEY header with proper API key required.',
      );
      // Eventually handle the case of having a JWT or something, like user auth
    }
    next();
  }
}
