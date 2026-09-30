import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiPropertyOptional({ example: 'colour-uuid' })
  @IsString()
  @IsOptional()
  colourId?: string;

  @ApiPropertyOptional({ example: 'size-uuid' })
  @IsString()
  @IsOptional()
  sizeId?: string;

  @ApiProperty({ example: 'KTQ-BRD-001-EMR-L' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  stockQuantity: number;

  @ApiPropertyOptional({ example: 5000.0 })
  @IsNumber()
  @IsOptional()
  priceAdjustment?: number;
}

export class UpdateStockDto {
  @ApiProperty({ example: 15 })
  @IsNumber()
  stockQuantity: number;
}

export class AddProductImageDto {
  @ApiProperty({ example: 'products/peshwas-back.jpg' })
  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @ApiProperty({ example: '/assets/products/peshwas-back.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: '/assets/products/peshwas-back-thumb.jpg' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isPrimary?: boolean;
}
