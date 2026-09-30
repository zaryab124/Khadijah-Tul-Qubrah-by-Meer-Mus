import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ProductionStatus } from '@prisma/client';

export class CreateQualityCheckDto {
  @ApiProperty({
    example: 'PASSED',
    enum: ['PASSED', 'FAILED'],
    description: 'Quality check outcome: PASSED or FAILED',
  })
  @IsNotEmpty()
  @IsString()
  status: 'PASSED' | 'FAILED';

  @ApiPropertyOptional({
    example: 'Embroidery density and pearl embellishments exceed luxury standards.',
    description: 'General quality inspection remarks',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: ['Sleeve length 0.5 inches longer than custom spec', 'Loose thread at hem border'],
    description: 'Specific defect or tolerance issues identified if inspection failed',
  })
  @IsOptional()
  @IsArray()
  issues?: string[];

  @ApiPropertyOptional({
    enum: ProductionStatus,
    example: ProductionStatus.STITCHING,
    description: 'If inspection FAILED, which production stage must rework the garment',
  })
  @IsOptional()
  @IsEnum(ProductionStatus)
  reworkStage?: ProductionStatus;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  measurementAccuracyVerified?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  fabricFinishVerified?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  embroideryAccuracyVerified?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  stitchingDensityVerified?: boolean = true;

  @ApiPropertyOptional({
    example: ['qc/inspections/job-1/front-hem-measurement.jpg'],
  })
  @IsOptional()
  @IsArray()
  inspectionPhotos?: string[];
}
