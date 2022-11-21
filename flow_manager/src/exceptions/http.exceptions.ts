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

export class HttpNotFoundException extends HttpException {
  constructor() {
    super('Item not found', HttpStatus.NOT_FOUND);
  }
}

export class HttpBadRequestException extends HttpException {
  constructor() {
    super('Error in request parameters', HttpStatus.BAD_REQUEST);
  }
}

export class HttpNotImplementedException extends HttpException {
  constructor() {
    super('Feature not yet implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
