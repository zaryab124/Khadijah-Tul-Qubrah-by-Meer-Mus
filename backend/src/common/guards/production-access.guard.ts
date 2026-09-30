import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class ProductionAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    const permittedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCTION];
    if (!permittedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Access denied: Production jobs and workshop management restricted to atelier personnel and administration.',
      );
    }

    return true;
  }
}
