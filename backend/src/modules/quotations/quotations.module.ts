import { Module, forwardRef } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { DesignerController } from './designer.controller';
import { AuditModule } from '../../common/services/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [QuotationsController, DesignerController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
