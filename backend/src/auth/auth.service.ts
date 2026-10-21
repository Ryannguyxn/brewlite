import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashPassword } from './password-hash.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { RegisterResponseDto } from './dto/register-response.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponseDto } from './dto/login-response.dto.js';
import { ACCESS_TOKEN_TTL_SECONDS } from './jwt.config.js';

// Public dummy hash, not an account credential. Keep the bcrypt cost equal to registration
// so an unknown email still performs a password comparison.
const DUMMY_PASSWORD_HASH =
  '$2b$12$GuZNPHOCQGtbICya815YWuE7RIyNM.ckMg3NldkzmxTIQc0g9Is2O';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() },
        select: { id: true, passwordHash: true },
      });
      const matches = await bcrypt.compare(
        dto.password,
        user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      );
      if (!user || !matches) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Invalid email or password',
          error: 'Unauthorized',
          code: 'INVALID_CREDENTIALS',
        });
      }
      const accessToken = await this.jwt.signAsync({ sub: user.id });
      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Failed to log in customer');
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    try {
      const passwordHash = await hashPassword(dto.password);

      // The database unique constraint is authoritative, including concurrent requests.
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
        },
        select: { id: true, email: true, fullName: true },
      });

      return { id: user.id, email: user.email, fullName: user.fullName };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Email already exists',
          error: 'Conflict',
          code: 'EMAIL_ALREADY_EXISTS',
        });
      }

      // Do not log the request, password, hash or raw database errors.
      this.logger.error('Failed to register customer');
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
