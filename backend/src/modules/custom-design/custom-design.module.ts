import { Module, forwardRef } from '@nestjs/common';
import { CustomDesignService } from './custom-design.service';
import { CustomDesignController } from './custom-design.controller';
import { StorageModule } from '../../common/services/storage.module';
import { AuditModule } from '../../common/services/audit.module';
import { QuotationsModule } from '../quotations/quotations.module';

@Module({
  imports: [StorageModule, AuditModule, forwardRef(() => QuotationsModule)],
  controllers: [CustomDesignController],
  providers: [CustomDesignService],
  exports: [CustomDesignService],
})
export class CustomDesignModule {}
