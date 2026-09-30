import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogAuditParams {
  actorId?: string;
  action: string;
  entityTable: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: LogAuditParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          action: params.action,
          entityTable: params.entityTable,
          entityId: params.entityId,
          previousState: params.previousState ? params.previousState : undefined,
          newState: params.newState ? params.newState : undefined,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (error: any) {
      // Never crash the primary business transaction due to audit logging failure
      this.logger.error(`Failed to record audit log for action "${params.action}": ${error.message}`);
      return null;
    }
  }
}
