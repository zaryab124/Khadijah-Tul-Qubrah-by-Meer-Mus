import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMeasurementTemplateDto {
  @ApiProperty({ example: 'Bridal Peshwas & Lehenga' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'BRIDAL_PESHWAS' })
  @IsString()
  @IsNotEmpty()
  garmentType: string;

  @ApiPropertyOptional({ example: 'Standard measurements required for bridal peshwas with flared skirt.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'INCHES' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({
    example: [
      { key: 'chest', label: 'Chest / Bust', required: true, min: 28, max: 60 },
      { key: 'waist', label: 'Empire Waist', required: true, min: 24, max: 55 },
      { key: 'hip', label: 'Hip (Fullest)', required: true, min: 30, max: 65 },
      { key: 'shoulder', label: 'Across Shoulder', required: true, min: 12, max: 20 },
      { key: 'shirtLength', label: 'Full Shirt Length', required: true, min: 36, max: 62 },
      { key: 'sleeveLength', label: 'Sleeve Length', required: true, min: 15, max: 27 },
      { key: 'armhole', label: 'Armhole Round', required: true, min: 14, max: 24 },
      { key: 'frontNeckDepth', label: 'Front Neck Depth', required: false, min: 5, max: 10 },
      { key: 'trouserLength', label: 'Trouser / Lehenga Length', required: true, min: 34, max: 48 },
    ],
  })
  @IsArray()
  fields: any[];
}
