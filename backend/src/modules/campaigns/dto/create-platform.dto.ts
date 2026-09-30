import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlatformDto {
  @ApiProperty({
    description: 'Unique platform code identifier',
    example: 'PINTEREST',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Platform display name',
    example: 'Pinterest Luxury Inspiration',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Platform notes or description',
    example: 'Bridal moodboards and velvet haute couture inspiration pins.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
