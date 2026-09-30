import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class OrderItemInputDto {
  @ApiProperty({
    example: 'var-uuid-1234',
    description: 'Product variant ID (containing SKU, colour, size, price adjustment)',
  })
  @IsNotEmpty()
  @IsString()
  productVariantId: string;

  @ApiProperty({ example: 1, minimum: 1, default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number = 1;
}
