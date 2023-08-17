import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpRouteNotAvailableException extends HttpException {
  constructor() {
    super(
      'This route is not available in the current environment',
      HttpStatus.FORBIDDEN,
    );
  }
}
