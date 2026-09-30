import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateProductionJobDto {
  @ApiProperty({ example: 'order-uuid-1234' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'order-item-uuid-5678' })
  @IsNotEmpty()
  @IsString()
  orderItemId: string;

  @ApiPropertyOptional({ example: 'manager-uuid-9999' })
  @IsOptional()
  @IsString()
  assignedManagerId?: string;

  @ApiPropertyOptional({ example: '2026-10-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  targetCompletionDate?: string;

  @ApiPropertyOptional({
    example: 'Handle velvet pile with caution. High priority bridal dispatch.',
  })
  @IsOptional()
  @IsString()
  productionNotes?: string;
}
