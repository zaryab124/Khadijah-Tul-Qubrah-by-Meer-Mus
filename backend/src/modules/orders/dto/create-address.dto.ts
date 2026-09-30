import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home', default: 'Home' })
  @IsOptional()
  @IsString()
  addressTitle?: string;

  @ApiProperty({ example: 'Sarah Khan' })
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @ApiProperty({ example: '+923001234567' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'House 45, Street 12, Sector F-7/2' })
  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Near Main Market' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Islamabad' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Federal Capital' })
  @IsOptional()
  @IsString()
  stateProvince?: string;

  @ApiPropertyOptional({ example: '44000' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Pakistan', default: 'Pakistan' })
  @IsOptional()
  @IsString()
  country?: string = 'Pakistan';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isDefaultShipping?: boolean = true;
}
