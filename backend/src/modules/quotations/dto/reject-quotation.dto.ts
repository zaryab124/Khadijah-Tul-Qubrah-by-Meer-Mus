import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectQuotationDto {
  @ApiPropertyOptional({
    example: 'Budget exceeded or timeline does not align with my event date.',
    description: 'Reason for declining the quotation',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
