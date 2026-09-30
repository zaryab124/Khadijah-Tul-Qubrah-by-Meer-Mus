import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Active status flag for the account' })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Audit rationale or justification for the status update' })
  @IsString()
  @IsOptional()
  reason?: string;
}
