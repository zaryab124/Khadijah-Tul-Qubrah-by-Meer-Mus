import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBrandDto {
  @ApiPropertyOptional({ example: 'KHADIJA-TUL-QUBRAH BY Meer&Mus' })
  @IsString()
  @IsOptional()
  officialName?: string;

  @ApiPropertyOptional({ example: 'KHADIJA-TUL-QUBRAH' })
  @IsString()
  @IsOptional()
  primaryDisplay?: string;

  @ApiPropertyOptional({ example: 'BY Meer&Mus' })
  @IsString()
  @IsOptional()
  secondarySignature?: string;

  @ApiPropertyOptional({ example: '#072A20' })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#C5A059' })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiPropertyOptional({ example: '#FCFBF7' })
  @IsString()
  @IsOptional()
  accentColor?: string;

  @ApiPropertyOptional({ example: 'concierge@khadijatulqubrah.com' })
  @IsString()
  @IsOptional()
  supportEmail?: string;

  @ApiPropertyOptional({ example: '+92 42 35789000' })
  @IsString()
  @IsOptional()
  supportPhone?: string;

  @ApiPropertyOptional({ example: '+92 300 0000000' })
  @IsString()
  @IsOptional()
  whatsappNumber?: string;
}
