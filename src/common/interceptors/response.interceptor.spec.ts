import { describe, it, expect } from 'vitest';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { of, lastValueFrom } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  const mockExecutionContext = {} as ExecutionContext;

  it('should wrap response data in standard format', async () => {
    const testData = { id: 1, name: 'Test' };
    const callHandler: CallHandler = {
      handle: () => of(testData),
    };

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    expect(result).toEqual({
      isSuccess: true,
      message: 'Success',
      data: testData,
    });
  });

  it('should wrap null data', async () => {
    const callHandler: CallHandler = {
      handle: () => of(null),
    };

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    expect(result).toEqual({
      isSuccess: true,
      message: 'Success',
      data: null,
    });
  });

  it('should wrap array data', async () => {
    const testData = [{ id: 1 }, { id: 2 }];
    const callHandler: CallHandler = {
      handle: () => of(testData),
    };

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, callHandler),
    );

    expect(result).toEqual({
      isSuccess: true,
      message: 'Success',
      data: testData,
    });
  });
});
