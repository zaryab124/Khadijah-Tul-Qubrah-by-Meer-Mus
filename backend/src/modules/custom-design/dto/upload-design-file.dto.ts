import { IsNotEmpty, IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDesignFileDto {
  @ApiProperty({ example: 'lehenga-inspiration-front.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    example: 'INSPIRATION_IMAGE',
    enum: ['INSPIRATION_IMAGE', 'DESIGN_SKETCH', 'MEASUREMENT_SHEET', 'FABRIC_SWATCH'],
  })
  @IsIn(['INSPIRATION_IMAGE', 'DESIGN_SKETCH', 'MEASUREMENT_SHEET', 'FABRIC_SWATCH'])
  fileType: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: 2450000 })
  @IsNumber()
  fileSizeBytes: number;

  @ApiPropertyOptional({ example: 'custom-requests/user-1/sketch.jpg' })
  @IsString()
  @IsOptional()
  storageKey?: string;

  @ApiPropertyOptional({ example: 'custom-requests/user-1/thumbnails/sketch_thumb.webp' })
  @IsString()
  @IsOptional()
  thumbnailKey?: string;
}
