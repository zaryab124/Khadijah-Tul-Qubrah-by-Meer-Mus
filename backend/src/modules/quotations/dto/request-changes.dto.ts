import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestChangesDto {
  @ApiProperty({
    example:
      'The overall design is stunning. Can we reduce the heavy embroidery on the lower sleeves to lower the cost slightly? Also, please adjust estimated delivery by 5 days earlier if possible.',
    description: 'Detailed explanation of revisions or modifications requested by customer',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Please provide at least 10 characters detailing your change request.' })
  changeNotes: string;
}
