import { IsNotEmpty, IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCraftOptionDto {
  @ApiProperty({ example: 'Zardozi Handwork' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'EMBROIDERY' })
  @IsString()
  @IsOptional()
  craftCategory?: string;

  @ApiPropertyOptional({ example: 'Three-dimensional gold wire work with kora, dabka, sequins, and micro-pearls.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '/assets/crafts/zardozi-sample.jpg' })
  @IsString()
  @IsOptional()
  sampleImageUrl?: string;

  @ApiPropertyOptional({ example: 21 })
  @IsInt()
  @IsOptional()
  estimatedDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
