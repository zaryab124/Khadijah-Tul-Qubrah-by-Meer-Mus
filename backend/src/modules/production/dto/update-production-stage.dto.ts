import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsString, Min, Max, IsArray } from 'class-validator';
import { ProductionStatus } from '@prisma/client';

export class UpdateProductionStageDto {
  @ApiProperty({
    enum: ProductionStatus,
    example: ProductionStatus.CUTTING,
    description: 'Target production stage to transition into',
  })
  @IsNotEmpty()
  @IsEnum(ProductionStatus)
  stage: ProductionStatus;

  @ApiPropertyOptional({
    example: 20,
    minimum: 0,
    maximum: 100,
    description: 'Progress percentage (0, 20, 40, 60, 80, 100)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @ApiPropertyOptional({
    example: 'Fabric inspected and pattern pieces cut according to custom measurement template.',
    description: 'Artisan notes or stage completion remarks',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: ['production/jobs/job-1/cutting-stage.jpg'],
    description: 'Optional S3 photo storage keys taken during workshop crafting',
  })
  @IsOptional()
  @IsArray()
  photoStorageKeys?: string[];
}
