import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiSuccessResponse } from '@common/dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        isSuccess: true as const,
        message: 'Success',
        data,
      })),
    );
  }
}
