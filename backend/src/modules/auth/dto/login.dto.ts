import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'sarah.customer@example.com' })
  @IsString()
  @IsNotEmpty({ message: 'Email or phone number is required' })
  identifier: string;

  @ApiProperty({ example: 'KhadijaSecure2026!' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
