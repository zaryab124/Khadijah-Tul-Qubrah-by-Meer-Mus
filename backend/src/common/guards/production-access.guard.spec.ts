import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ProductionAccessGuard } from './production-access.guard';

describe('ProductionAccessGuard (Production Floor Isolation)', () => {
  let guard: ProductionAccessGuard;

  beforeEach(() => {
    guard = new ProductionAccessGuard();
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it('should allow PRODUCTION personnel to access production jobs', () => {
    const context = createMockContext({ role: UserRole.PRODUCTION });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN and SUPER_ADMIN to inspect production jobs', () => {
    const adminContext = createMockContext({ role: UserRole.ADMIN });
    expect(guard.canActivate(adminContext)).toBe(true);

    const superAdminContext = createMockContext({ role: UserRole.SUPER_ADMIN });
    expect(guard.canActivate(superAdminContext)).toBe(true);
  });

  it('should block CUSTOMER, AGENT, and DESIGNER from direct production floor access', () => {
    const customerContext = createMockContext({ role: UserRole.CUSTOMER });
    expect(() => guard.canActivate(customerContext)).toThrow(ForbiddenException);

    const agentContext = createMockContext({ role: UserRole.AGENT });
    expect(() => guard.canActivate(agentContext)).toThrow(ForbiddenException);

    const designerContext = createMockContext({ role: UserRole.DESIGNER });
    expect(() => guard.canActivate(designerContext)).toThrow(ForbiddenException);
  });
});
