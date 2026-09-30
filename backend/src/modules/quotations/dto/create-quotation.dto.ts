import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationItemDto } from './quotation-item.dto';

export class CreateQuotationDto {
  @ApiProperty({
    type: [QuotationItemDto],
    description: 'Itemized costing breakdown (fabric, craft, tailoring, etc.)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @ApiPropertyOptional({
    example: 15000,
    description: 'Customization fee for bespoke patterns, custom dying, or specialized alterations',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  customizationFee?: number = 0;

  @ApiPropertyOptional({
    example: 2500,
    description: 'Delivery and insured courier transit fee',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number = 0;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Promotional or seasonal courtesy discount',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number = 0;

  @ApiPropertyOptional({
    example: 0,
    description: 'Applicable provincial or sales tax',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number = 0;

  @ApiPropertyOptional({
    example: 14,
    description: 'Estimated minimum production turnaround days',
    default: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedMinDays?: number = 7;

  @ApiPropertyOptional({
    example: 28,
    description: 'Estimated maximum production turnaround days',
    default: 21,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedMaxDays?: number = 21;

  @ApiPropertyOptional({
    example:
      'Quotation includes hand-embroidered French knots, zardozi dabka with real pearls on emerald silk base. Fabric swatches will be prepared within 3 business days.',
  })
  @IsOptional()
  @IsString()
  designerNotes?: string;

  @ApiPropertyOptional({
    example: 14,
    description: 'Number of calendar days this quote remains valid for customer acceptance',
    default: 14,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validDays?: number = 14;
}
