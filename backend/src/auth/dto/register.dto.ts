import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    type: String,
    format: 'email',
    maxLength: 255,
    example: 'customer@example.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    type: String,
    format: 'password',
    writeOnly: true,
    minLength: 8,
    example: 'Password123',
    description: 'At least 8 characters; no application-level maximum length.',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: 'Nguyen Van A',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(255)
  fullName?: string;
}
