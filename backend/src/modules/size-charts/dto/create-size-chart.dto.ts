import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSizeChartDto {
  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 'Bridal & Formal Sizing Matrix' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'INCHES' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    example: [
      { size: 'XS', chest: '34', waist: '26', hip: '36', shoulder: '14' },
      { size: 'S', chest: '36', waist: '28', hip: '38', shoulder: '14.5' },
      { size: 'M', chest: '38', waist: '30', hip: '40', shoulder: '15' },
      { size: 'L', chest: '41', waist: '33', hip: '43', shoulder: '15.5' },
      { size: 'XL', chest: '44', waist: '36', hip: '46', shoulder: '16' },
    ],
  })
  measurementsMatrix: any;

  @ApiPropertyOptional({ example: 'Custom sizing is also available on request.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
