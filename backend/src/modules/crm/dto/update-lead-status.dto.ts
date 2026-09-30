import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: LeadStatus,
    example: LeadStatus.INTERESTED,
    description: 'Updated pipeline status for this lead',
  })
  @IsNotEmpty()
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @ApiPropertyOptional({
    example: 'Client confirmed budget and wishes to finalize fabric details.',
    description: 'Reason or summary notes for status transition',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
