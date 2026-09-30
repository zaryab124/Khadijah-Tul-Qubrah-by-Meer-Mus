import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemInputDto } from './order-item-input.dto';
import { CreateAddressDto } from './create-address.dto';

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemInputDto],
    description: 'List of product variants and quantities to purchase',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiPropertyOptional({
    example: 'addr-uuid-1234',
    description: 'Existing saved delivery address ID',
  })
  @IsOptional()
  @IsString()
  shippingAddressId?: string;

  @ApiPropertyOptional({
    type: CreateAddressDto,
    description: 'New shipping address to save and use for this order',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  shippingAddress?: CreateAddressDto;

  @ApiPropertyOptional({
    example: 'Please ring bell upon arrival and handle with delicate care.',
  })
  @IsOptional()
  @IsString()
  orderNotes?: string;

  @ApiPropertyOptional({
    example: 'SUMMER26',
    description: 'Marketing campaign code to attribute this order',
  })
  @IsOptional()
  @IsString()
  campaignCode?: string;
}
