import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ type: String, description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ type: String, enum: ['Bearer'], example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({
    type: Number,
    example: 3600,
    description: 'Lifetime in seconds',
  })
  expiresIn!: number;
}
