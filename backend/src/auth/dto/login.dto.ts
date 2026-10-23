import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
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
    minLength: 1,
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
