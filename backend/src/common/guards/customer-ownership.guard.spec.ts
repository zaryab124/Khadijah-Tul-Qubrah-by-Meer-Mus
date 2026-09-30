import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CustomerOwnershipGuard } from './customer-ownership.guard';

describe('CustomerOwnershipGuard (Customer Isolation & Protection)', () => {
  let guard: CustomerOwnershipGuard;

  beforeEach(() => {
    guard = new CustomerOwnershipGuard();
  });

  const createMockContext = (user: any, params: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as any;

  it('should allow customer to access their own resources (id matching user.id)', () => {
    const context = createMockContext(
      { id: 'cust-123', role: UserRole.CUSTOMER },
      { id: 'cust-123' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject unauthorized customer access when trying to access another customer profile', () => {
    const context = createMockContext(
      { id: 'cust-123', role: UserRole.CUSTOMER },
      { id: 'cust-456' }, // Target is another customer!
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow ADMIN and SUPER_ADMIN to inspect customer records', () => {
    const adminContext = createMockContext(
      { id: 'admin-1', role: UserRole.ADMIN },
      { id: 'cust-456' },
    );
    expect(guard.canActivate(adminContext)).toBe(true);

    const superAdminContext = createMockContext(
      { id: 'super-1', role: UserRole.SUPER_ADMIN },
      { id: 'cust-456' },
    );
    expect(guard.canActivate(superAdminContext)).toBe(true);
  });
});
