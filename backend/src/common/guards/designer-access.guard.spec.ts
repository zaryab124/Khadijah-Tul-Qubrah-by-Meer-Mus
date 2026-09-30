import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DesignerAccessGuard } from './designer-access.guard';

describe('DesignerAccessGuard (Designer Design Request Restrictions)', () => {
  let guard: DesignerAccessGuard;
  let prismaService: any;

  beforeEach(() => {
    prismaService = {
      customDesignRequest: {
        findUnique: jest.fn(),
      },
    };
    guard = new DesignerAccessGuard(prismaService);
  });

  const createMockContext = (user: any, params: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as any;

  it('should allow designer to access design request assigned to them', async () => {
    prismaService.customDesignRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      assignedDesignerId: 'designer-zainab',
    });

    const context = createMockContext(
      { id: 'designer-zainab', role: UserRole.DESIGNER },
      { id: 'req-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if designer tries to access request assigned to another designer', async () => {
    prismaService.customDesignRequest.findUnique.mockResolvedValue({
      id: 'req-2',
      assignedDesignerId: 'designer-other',
    });

    const context = createMockContext(
      { id: 'designer-zainab', role: UserRole.DESIGNER },
      { id: 'req-2' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow SUPER_ADMIN to access any design request', async () => {
    const context = createMockContext(
      { id: 'super-1', role: UserRole.SUPER_ADMIN },
      { id: 'req-2' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
