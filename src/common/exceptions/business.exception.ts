import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        isSuccess: false,
        message,
      },
      statusCode,
    );
  }
}

export class EntityNotFoundException extends BusinessException {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class EntityConflictException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}

export class ForbiddenActionException extends BusinessException {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class InvalidStateException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
