import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestClarificationDto {
  @ApiProperty({
    example:
      'Please clarify if you prefer antique dull gold zardozi wire or bright metallic gold for the neckline embroidery.',
    description: 'Designer inquiry to customer to clarify design specifications',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Please provide at least 10 characters for clarification inquiry.' })
  clarificationNotes: string;
}
