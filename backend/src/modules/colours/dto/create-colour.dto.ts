import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColourDto {
  @ApiProperty({ example: 'Emerald Velvet Green' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#072A20' })
  @IsString()
  @IsNotEmpty()
  hexCode: string;

  @ApiPropertyOptional({ example: 'Signature deep emerald velvet' })
  @IsString()
  @IsOptional()
  description?: string;
}
