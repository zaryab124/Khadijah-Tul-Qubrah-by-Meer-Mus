import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [CrmModule],
  exports: [CrmModule],
})
export class LeadsModule {}
