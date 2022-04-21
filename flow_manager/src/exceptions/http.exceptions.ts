import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpServerErrorException extends HttpException {
  constructor() {
    super('Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class HttpConflictException extends HttpException {
  constructor() {
    super('Conflict', HttpStatus.CONFLICT);
  }
}

export class HttpForbiddenException extends HttpException {
  constructor() {
    super('Invalid credentials', HttpStatus.FORBIDDEN);
  }
}
