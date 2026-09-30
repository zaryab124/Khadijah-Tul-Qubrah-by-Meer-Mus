import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class ConvertLeadDto {
  @ApiPropertyOptional({
    example: 'user-uuid-1234',
    description: 'Existing customer user ID to link this lead to',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'If true and customerId is not provided, automatically creates a new customer account',
  })
  @IsOptional()
  @IsBoolean()
  createCustomer?: boolean = true;

  @ApiPropertyOptional({
    example: 'order-uuid-5678',
    description: 'Associated converted order ID (if converted via catalog purchase)',
  })
  @IsOptional()
  @IsString()
  convertedOrderId?: string;

  @ApiPropertyOptional({
    example: 'req-uuid-9999',
    description: 'Associated bespoke custom design request ID',
  })
  @IsOptional()
  @IsString()
  customRequestId?: string;

  @ApiPropertyOptional({
    example: 'Successfully converted VIP inquiry into high-ticket bridal couture order.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
