import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { hashPassword } from './password-hash.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { RegisterResponseDto } from './dto/register-response.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
