import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from './jwt.strategy.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | false | null | undefined,
  ): TUser {
    if (error || !user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }
    return user;
  }
}
