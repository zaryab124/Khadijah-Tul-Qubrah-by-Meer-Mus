import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomRequestDto {
  @ApiPropertyOptional({
    description: 'Reference product UUID if based on ready-to-wear, or null if "My Own Design"',
    example: 'product-uuid-or-null',
  })
  @IsString()
  @IsOptional()
  referencedProductId?: string;

  @ApiPropertyOptional({ example: 'Emerald Green with Antique Gold Accents' })
  @IsString()
  @IsOptional()
  colourPreference?: string;

  @ApiPropertyOptional({ example: 'colour-uuid' })
  @IsString()
  @IsOptional()
  colourId?: string;

  @ApiPropertyOptional({ example: 'fabric-uuid' })
  @IsString()
  @IsOptional()
  fabricId?: string;

  @ApiPropertyOptional({
    example: ['craft-uuid-zardozi', 'craft-uuid-crochet'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  craftOptionIds?: string[];

  @ApiProperty({ example: 'CUSTOM', enum: ['STANDARD', 'CUSTOM'] })
  @IsIn(['STANDARD', 'CUSTOM'])
  sizingMode: 'STANDARD' | 'CUSTOM';

  @ApiPropertyOptional({ example: 'size-uuid-medium' })
  @IsString()
  @IsOptional()
  standardSizeId?: string;

  @ApiPropertyOptional({ example: 'template-uuid-bridal' })
  @IsString()
  @IsOptional()
  measurementTemplateId?: string;

  @ApiPropertyOptional({
    example: {
      chest: 38.0,
      waist: 30.5,
      hip: 41.0,
      shirtLength: 46.0,
      sleeveLength: 22.5,
      shoulder: 15.0,
      armhole: 17.5,
    },
  })
  @IsOptional()
  customMeasurements?: Record<string, any>;

  @ApiPropertyOptional({
    example:
      'I want heavy metallic zardozi on neckline and hemline, with delicate crochet scallops on sleeve borders.',
  })
  @IsString()
  @IsOptional()
  designNotes?: string;

  @ApiPropertyOptional({ example: 175000.0 })
  @IsNumber()
  @IsOptional()
  customerBudget?: number;

  @ApiPropertyOptional({ example: '2026-11-20' })
  @IsOptional()
  expectedDeliveryDate?: Date;
}
