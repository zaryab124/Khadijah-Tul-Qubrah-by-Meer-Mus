import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { StorageModule } from '../../common/services/storage.module';
import { AuditModule } from '../../common/services/audit.module';

@Module({
  imports: [StorageModule, AuditModule],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
