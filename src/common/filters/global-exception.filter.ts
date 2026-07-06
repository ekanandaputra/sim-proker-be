import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

interface ErrorResponseBody {
  isSuccess: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorResponseBody = {
      isSuccess: false,
      message: 'Internal server error',
    };

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        isSuccess: false,
        message: 'Validation failed',
        errors: exception.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        body = { isSuccess: false, message: exceptionResponse };
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        body = {
          isSuccess: false,
          message: (resp['message'] as string) ?? exception.message,
          errors: resp['errors'] as Array<{ field: string; message: string }> | undefined,
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      body = { isSuccess: false, message: 'Internal server error' };
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(body);
  }
}
