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
export class DesignerAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // SUPER_ADMIN and ADMIN have full design studio oversight
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.role !== UserRole.DESIGNER) {
      throw new ForbiddenException('Access restricted to assigned couture designers or administration');
    }

    const requestId = request.params.customRequestId || request.params.requestId || request.params.id;
    if (!requestId) {
      return true; // List queries are scoped to assigned designer
    }

    const designRequest = await this.prisma.customDesignRequest.findUnique({
      where: { id: requestId },
      select: { id: true, assignedDesignerId: true },
    });

    if (!designRequest) {
      throw new NotFoundException(`Custom design request ${requestId} not found`);
    }

    if (designRequest.assignedDesignerId !== user.id) {
      throw new ForbiddenException(
        'Access denied: Designers may only access design requests and customer sketches assigned directly to them.',
      );
    }

    return true;
  }
}
