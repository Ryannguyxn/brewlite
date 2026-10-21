import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'customer@example.com',
  })
  email!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Nguyen Van A' })
  fullName!: string | null;
}
