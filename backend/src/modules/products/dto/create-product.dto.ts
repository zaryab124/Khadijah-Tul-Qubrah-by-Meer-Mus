import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductVariantInputDto {
  @ApiPropertyOptional({ example: 'colour-uuid' })
  @IsString()
  @IsOptional()
  colourId?: string;

  @ApiPropertyOptional({ example: 'size-uuid' })
  @IsString()
  @IsOptional()
  sizeId?: string;

  @ApiProperty({ example: 'KTQ-BRD-001-EMR-M' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  stockQuantity: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsNumber()
  @IsOptional()
  priceAdjustment?: number;
}

export class ProductImageInputDto {
  @ApiProperty({ example: 'products/velvet-peshwas-front.jpg' })
  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @ApiProperty({ example: '/assets/products/velvet-peshwas-front.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: '/assets/products/velvet-peshwas-front-thumb.jpg' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Shahzadi Emerald Velvet Peshwas' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'shahzadi-emerald-velvet-peshwas' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'KTQ-BRD-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example:
      'Heirloom bridal peshwas handcrafted on pure Micro Velvet 9000, lavishly adorned with antique gold zardozi and kora dabka.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 185000.0 })
  @IsNumber()
  basePrice: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isCustomizable?: boolean;

  @ApiPropertyOptional({ example: 'size-chart-uuid' })
  @IsString()
  @IsOptional()
  sizeChartId?: string;

  @ApiPropertyOptional({ example: ['Bridal', 'Velvet', 'Zardozi', 'Heirloom'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [ProductVariantInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  @IsOptional()
  variants?: ProductVariantInputDto[];

  @ApiPropertyOptional({ type: [ProductImageInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  @IsOptional()
  images?: ProductImageInputDto[];
}
