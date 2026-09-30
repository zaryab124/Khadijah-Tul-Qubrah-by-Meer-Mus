import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class UpdateAgentProfileDto {
  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxActiveLeads?: number;

  @ApiPropertyOptional({ example: 5.0, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
