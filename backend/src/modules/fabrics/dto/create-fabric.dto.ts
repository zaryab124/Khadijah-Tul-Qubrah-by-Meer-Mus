import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFabricDto {
  @ApiProperty({ example: 'Micro Velvet 9000' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Plush, dense-pile imported velvet with a regal sheen' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '/assets/fabrics/velvet-swatch.jpg' })
  @IsString()
  @IsOptional()
  swatchImageUrl?: string;

  @ApiProperty({ example: 6500.0 })
  @IsNumber()
  basePricePerMeter: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
