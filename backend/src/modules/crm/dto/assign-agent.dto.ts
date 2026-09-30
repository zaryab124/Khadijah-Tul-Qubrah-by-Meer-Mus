import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AssignAgentDto {
  @ApiProperty({
    example: 'agent-uuid-1234',
    description: 'Target sales agent user ID to assign or reassign the lead to',
  })
  @IsNotEmpty()
  @IsString()
  agentId: string;

  @ApiPropertyOptional({
    example: 'Reassigned for specialized bridal couture consultation.',
    description: 'Assignment or reassignment context notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
