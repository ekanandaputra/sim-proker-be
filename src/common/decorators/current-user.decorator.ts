import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '@common/guards/jwt-auth.guard';

/**
 * Decorator to extract the current authenticated user from the request.
 * @example
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 *   @Get('profile')
 *   getProfile(@CurrentUser('userId') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
