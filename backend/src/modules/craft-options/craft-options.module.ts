import { Module } from '@nestjs/common';
import { CraftOptionsService } from './craft-options.service';
import { CraftOptionsController } from './craft-options.controller';

@Module({
  controllers: [CraftOptionsController],
  providers: [CraftOptionsService],
  exports: [CraftOptionsService],
})
export class CraftOptionsModule {}
