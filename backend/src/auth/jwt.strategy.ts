import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { isUUID } from 'class-validator';
import { getJwtSecret } from './jwt.config.js';

export interface AuthenticatedUser {
  userId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtSecret(),
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  validate(payload: unknown): AuthenticatedUser {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('sub' in payload) ||
      typeof payload.sub !== 'string' ||
      !isUUID(payload.sub) ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    ) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }
    // Passport verifies the signature and expiry before calling validate().
    // Orders must use this verified ID instead of accepting a body userId.
    return { userId: payload.sub };
  }
}
