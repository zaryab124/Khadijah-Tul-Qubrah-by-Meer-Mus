import { Module } from '@nestjs/common';
import { SizeChartsService } from './size-charts.service';
import { SizeChartsController } from './size-charts.controller';

@Module({
  controllers: [SizeChartsController],
  providers: [SizeChartsService],
  exports: [SizeChartsService],
})
export class SizeChartsModule {}
