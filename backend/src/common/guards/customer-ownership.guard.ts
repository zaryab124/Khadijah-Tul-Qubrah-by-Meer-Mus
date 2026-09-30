import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class CustomerOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // SUPER_ADMIN and ADMIN have bypass privileges
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    // Target user ID from route params (e.g. /users/:id or /customers/:customerId)
    const targetUserId = request.params.customerId || request.params.userId || request.params.id;

    if (user.role === UserRole.CUSTOMER) {
      if (!targetUserId || targetUserId === user.id) {
        return true;
      }
      throw new ForbiddenException(
        'Access denied: Customers are strictly restricted to their own account records, requests, and files.',
      );
    }

    // Staff roles (AGENT, DESIGNER, PRODUCTION) must use their dedicated domain routes
    throw new ForbiddenException('Access denied: Unauthorized role for customer private records.');
  }
}
