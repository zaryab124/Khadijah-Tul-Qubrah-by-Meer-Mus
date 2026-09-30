import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class QuotationItemDto {
  @ApiProperty({
    example: 'Pure Katan Silk Base Fabric (5 Meters)',
    description: 'Title of the quotation item',
  })
  @IsNotEmpty()
  @IsString()
  itemTitle: string;

  @ApiProperty({
    example: 'FABRIC',
    description: 'Item category: FABRIC, CRAFT, STITCHING, CUSTOMIZATION, OTHER',
  })
  @IsNotEmpty()
  @IsString()
  itemType: string;

  @ApiPropertyOptional({
    example: 'High-grade royal bottle green pure katan silk sourced from Lahore ateliers',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, minimum: 1, default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number = 1;

  @ApiProperty({
    example: 45000,
    minimum: 0,
    description: 'Unit price in PKR. Line total = quantity * unitPrice',
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
