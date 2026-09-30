import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';

@Module({
  imports: [ConfigModule],
  controllers: [BrandController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}
