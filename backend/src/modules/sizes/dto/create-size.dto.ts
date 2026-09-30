import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSizeDto {
  @ApiProperty({ example: 'Medium' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
