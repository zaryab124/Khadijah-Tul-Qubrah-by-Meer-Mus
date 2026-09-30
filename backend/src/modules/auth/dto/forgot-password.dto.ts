import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'sarah.khan@example.com' })
  @IsString()
  @IsNotEmpty({ message: 'Email address or phone number is required' })
  identifier: string;
}
