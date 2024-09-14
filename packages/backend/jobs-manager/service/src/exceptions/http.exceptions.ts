import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpServerErrorException extends HttpException {
  constructor(message: string = 'Error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class HttpConflictException extends HttpException {
  constructor(message: string = 'Conflict') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class HttpForbiddenException extends HttpException {
  constructor(message: string = 'Invalid credentials') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class HttpNotFoundException extends HttpException {
  constructor(...ids: string[]) {
    super(
      `Item not found ${ids.length > 0 ? ` (${ids.join(', ')})` : ''}`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class HttpBadRequestException extends HttpException {
  constructor(message: string = 'Error in request parameters') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class HttpNotImplementedException extends HttpException {
  constructor(message: string = 'Feature not yet implemented') {
    super(message, HttpStatus.NOT_IMPLEMENTED);
  }
}
