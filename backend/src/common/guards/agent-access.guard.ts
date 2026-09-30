import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // SUPER_ADMIN and ADMIN have global lead oversight
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.role !== UserRole.AGENT) {
      throw new ForbiddenException('Access restricted to assigned sales agents or administration');
    }

    const leadId = request.params.leadId || request.params.id;
    if (!leadId) {
      return true; // List endpoints are filtered by service layer
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, assignedAgentId: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    if (lead.assignedAgentId !== user.id) {
      throw new ForbiddenException(
        'Access denied: Agents may only access leads and customer inquiries assigned directly to them.',
      );
    }

    return true;
  }
}
